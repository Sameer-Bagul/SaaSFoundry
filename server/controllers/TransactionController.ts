import { Request, Response } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

export class TransactionController {
  // Create a new transaction
  static async createTransaction(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { packageName, credits, amount, currency, paymentMethod } = req.body;

      const transaction = new Transaction({
        userId: user._id,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        packageName,
        credits,
        amount,
        currency,
        paymentMethod,
        status: 'pending'
      });

      await transaction.save();
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  // Get user transactions
  static async getUserTransactions(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { page = 1, limit = 10, status } = req.query;

      const filter: any = { userId: user._id };
      if (status) {
        filter.status = status;
      }

      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Transaction.countDocuments(filter);

      res.json({
        transactions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }

  // Update transaction status
  static async updateTransactionStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const { status, razorpayPaymentId } = req.body;

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const updateData: any = { status };
      if (razorpayPaymentId) {
        updateData.razorpayPaymentId = razorpayPaymentId;
      }

      // If transaction is completed, add credits to user
      if (status === 'completed' && transaction.status !== 'completed') {
        await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { credits: transaction.credits } }
        );
      }

      const updatedTransaction = await Transaction.findOneAndUpdate(
        { transactionId },
        updateData,
        { new: true }
      );

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }

  // Process payment (webhook simulation)
  static async processPayment(req: Request, res: Response) {
    try {
      const { transactionId, paymentId, status } = req.body;

      const transaction = await Transaction.findOneAndUpdate(
        { transactionId },
        { 
          status: status === 'success' ? 'completed' : 'failed',
          razorpayPaymentId: paymentId 
        },
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Add credits if payment successful
      if (status === 'success') {
        await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { credits: transaction.credits } }
        );
      }

      res.json({ message: 'Payment processed', transaction });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }
}

export default TransactionController;