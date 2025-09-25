import { Request, Response } from 'express';
import { storage } from '../storage';
import PaymentController from './PaymentController';
import { IUser } from '../models/User';
import { ITransaction } from '../models/Transaction';
import logger from '../utils/logger';

export class TokenController {
  // Create token purchase order
  static async createOrder(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      logger.info('TokenController.createOrder called', {
        userId: user?._id,
        body: req.body
      });

      return await PaymentController.createOrder(req, res);
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('TokenController.createOrder error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: 'Failed to create token order',
        message: error.message
      });
    }
  }

  // Verify payment and update tokens
  static async verifyPayment(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      logger.info('TokenController.verifyPayment called', {
        userId: user?._id,
        body: req.body
      });

      return await PaymentController.verifyPayment(req, res);
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('TokenController.verifyPayment error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: 'Failed to verify payment',
        message: error.message
      });
    }
  }

  // Get user's token purchase history
  static async getHistory(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { page = 1, limit = 10, status } = req.query;

      logger.info('TokenController.getHistory called', {
        userId: user._id,
        query: req.query
      });

      // Optimized query: filter by userId and status directly in database
      const query: any = { userId: user._id };
      if (status) {
        query.status = status;
      }

      // Get total count for pagination
      const total = await storage.getTransactionCount(query);

      // Get paginated transactions
      const transactions = await storage.getTransactionsPaginated(query, {
        page: Number(page),
        limit: Number(limit),
        sort: { createdAt: -1 }
      });

      // Remove sensitive fields
      const sanitizedTransactions = transactions.map(t => ({
        ...t,
        razorpaySignature: undefined,
        razorpayPaymentId: undefined
      }));

      logger.info('TokenController.getHistory success', {
        userId: user._id,
        total,
        returned: sanitizedTransactions.length
      });

      res.json({
        transactions: sanitizedTransactions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: Number(page) * Number(limit) < total
      });
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('TokenController.getHistory error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: 'Failed to get token history',
        message: error.message
      });
    }
  }

  // Get user's current token balance
  static async getBalance(req: Request, res: Response) {
    try {
      const user = req.user as IUser;

      logger.info('TokenController.getBalance called', {
        userId: user._id
      });

      // Get fresh user data to ensure token balance is up to date
      const currentUser = await storage.getUser(user._id);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Get recent token transactions for context
      const recentTransactions = await storage.getTransactions(user._id);
      const tokenTransactions = recentTransactions
        .filter(t => t.status === 'completed')
        .slice(0, 5); // Last 5 completed transactions

      const balance = {
        currentTokens: currentUser.tokens,
        totalPurchased: tokenTransactions.reduce((sum, t) => sum + t.tokens, 0),
        lastUpdated: currentUser.updatedAt,
        recentTransactions: tokenTransactions.map(t => ({
          id: t.transactionId,
          tokens: t.tokens,
          amount: t.amount,
          currency: t.currency,
          date: t.createdAt
        }))
      };

      logger.info('TokenController.getBalance success', {
        userId: user._id,
        balance: balance.currentTokens
      });

      res.json(balance);
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('TokenController.getBalance error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: 'Failed to get token balance',
        message: error.message
      });
    }
  }

  // Get token purchase statistics
  static async getStats(req: Request, res: Response) {
    try {
      const user = req.user as IUser;

      logger.info('TokenController.getStats called', {
        userId: user._id
      });

      const transactions = await storage.getTransactions(user._id);
      const completedTransactions = transactions.filter(t => t.status === 'completed');

      const stats = {
        totalPurchases: completedTransactions.length,
        totalTokensPurchased: completedTransactions.reduce((sum, t) => sum + t.tokens, 0),
        totalSpent: completedTransactions.reduce((sum, t) => sum + t.amount, 0),
        averagePurchase: completedTransactions.length > 0
          ? completedTransactions.reduce((sum, t) => sum + t.amount, 0) / completedTransactions.length
          : 0,
        lastPurchase: completedTransactions.length > 0
          ? completedTransactions[0].createdAt
          : null,
        currency: completedTransactions.length > 0 ? completedTransactions[0].currency : 'USD'
      };

      logger.info('TokenController.getStats success', {
        userId: user._id,
        stats
      });

      res.json(stats);
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('TokenController.getStats error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: 'Failed to get token stats',
        message: error.message
      });
    }
  }
}

export default TokenController;