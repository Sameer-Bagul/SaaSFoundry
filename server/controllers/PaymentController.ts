import { Request, Response } from 'express';
import { storage } from '../storage';
import RazorpayService from '../services/RazorpayService';
import InvoiceService from '../services/InvoiceService';
import { config } from '../config/environment';
import User, { IUser } from '../models/User';
import Transaction, { ITransaction } from '../models/Transaction';
import logger from '../utils/logger';

// Token packages available for purchase (aligned with frontend)
export const TOKEN_PACKAGES = {
  '10': { tokens: 10, basePrice: 20, name: '10 Tokens' },
  '50': { tokens: 50, basePrice: 100, name: '50 Tokens' },
  '100': { tokens: 100, basePrice: 200, name: '100 Tokens' }
};

export class PaymentController {
  // Get available token packages with pricing for user's country
  static async getPackages(req: Request, res: Response) {
    try {
      const { country = 'US' } = req.query;
      const billingCountry = String(country).toUpperCase();

      const packages = Object.entries(TOKEN_PACKAGES).map(([key, pkg]) => {
        const taxInfo = RazorpayService.getTaxInfo(billingCountry);
        const currency = billingCountry === 'IN' ? 'INR' : 'USD';
        
        // Convert USD to INR if needed (1 USD = 88 INR based on 1 token = $2 USD = ₹176 INR)
        let basePrice = pkg.basePrice;
        if (currency === 'INR') {
          basePrice = pkg.basePrice * 88; // USD to INR conversion
        }

        const taxAmount = taxInfo.applicable ? basePrice * taxInfo.rate : 0;
        const finalPrice = basePrice + taxAmount;

        return {
          id: key,
          name: pkg.name,
          tokens: pkg.tokens,
          basePrice,
          taxAmount,
          finalPrice,
          currency,
          taxInfo: {
            rate: taxInfo.rate,
            name: taxInfo.name,
            applicable: taxInfo.applicable
          },
          formattedPrice: RazorpayService.formatAmount(finalPrice, currency)
        };
      });

      res.json({
        packages,
        billingCountry,
        supportedCurrencies: RazorpayService.getSupportedCurrencies()
      });
    } catch (error) {
      console.error('Get packages error:', error);
      res.status(500).json({ error: 'Failed to get packages' });
    }
  }

  // Create Razorpay order
  static async createOrder(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { packageId, billingCountry = 'US', customTokens } = req.body;

      logger.info('PaymentController.createOrder called', {
        userId: user._id,
        packageId,
        billingCountry,
        customTokens
      });

      let tokens: number;
      let basePrice: number;
      let packageName: string;

      const country = String(billingCountry).toUpperCase();
      const currency = country === 'IN' ? 'INR' : 'USD';

      if (customTokens && parseInt(customTokens) > 0) {
        // Handle custom token quantity
        tokens = parseInt(customTokens);
        basePrice = currency === 'INR' ? tokens * 176 : tokens * 2; // 1 token = $2 = ₹176
        packageName = `${tokens} Tokens`;
      } else {
        // Validate package
        const selectedPackage = TOKEN_PACKAGES[packageId as keyof typeof TOKEN_PACKAGES];
        if (!selectedPackage) {
          logger.warn('Invalid package selected', { packageId, userId: user._id });
          return res.status(400).json({ error: 'Invalid package selected' });
        }

        tokens = selectedPackage.tokens;
        basePrice = selectedPackage.basePrice;
        packageName = selectedPackage.name;

        // Convert USD to INR if needed
        if (currency === 'INR') {
          basePrice = selectedPackage.basePrice * 88; // Convert USD to INR
        }
      }

      const taxInfo = RazorpayService.getTaxInfo(country);
      const taxAmount = taxInfo.applicable ? basePrice * taxInfo.rate : 0;
      const finalPrice = basePrice + taxAmount;

      // Create transaction record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Creating transaction', {
        userId: user._id,
        transactionId,
        tokens,
        finalPrice,
        currency
      });

      const transaction = await storage.createTransaction({
        userId: user._id,
        transactionId,
        packageName,
        tokens,
        amount: finalPrice,
        currency,
        status: 'pending'
      });

      // Create Razorpay order
      const razorpayOrder = await RazorpayService.createOrder({
        amount: finalPrice,
        currency,
        receipt: transactionId,
        billingCountry: country
      });

      // Update transaction with Razorpay order ID
      await storage.updateTransaction(transaction._id, {
        razorpayOrderId: razorpayOrder.id
      });

      logger.info('Order created successfully', {
        userId: user._id,
        transactionId,
        razorpayOrderId: razorpayOrder.id
      });

      res.status(201).json({
        id: razorpayOrder.id,
        amount: Math.round(finalPrice * 100), // Amount in smallest currency unit for Razorpay
        currency,
        transactionId,
        key: config.razorpayKeyId, // Add Razorpay key for frontend
        package: {
          id: packageId,
          name: packageName,
          tokens
        },
        billing: {
          country,
          basePrice,
          taxAmount,
          finalPrice,
          taxInfo
        }
      });
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('PaymentController.createOrder error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({
        error: error.message || 'Failed to create payment order'
      });
    }
  }

  // Verify payment and complete transaction
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      const user = req.user as IUser;

      logger.info('PaymentController.verifyPayment called', {
        userId: user._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      });

      // Verify payment signature
      const isValidSignature = RazorpayService.verifyPaymentSignature(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        logger.warn('Invalid payment signature', {
          userId: user._id,
          razorpayOrderId: razorpay_order_id
        });
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Find transaction by Razorpay order ID
      const transactions = await storage.getTransactions(user._id);
      const transaction = transactions.find(t => t.razorpayOrderId === razorpay_order_id);

      if (!transaction) {
        logger.warn('Transaction not found', {
          userId: user._id,
          razorpayOrderId: razorpay_order_id
        });
        return res.status(404).json({ error: 'Transaction not found' });
      }

      logger.info('Updating transaction to completed', {
        userId: user._id,
        transactionId: transaction.transactionId,
        tokens: transaction.tokens
      });

      // Update transaction as completed
      await storage.updateTransaction(transaction._id, {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod: 'razorpay'
      });

      // Add tokens to user
      await storage.updateUser(user._id, {
        tokens: user.tokens + transaction.tokens
      });

      logger.info('Tokens added to user', {
        userId: user._id,
        tokensAdded: transaction.tokens,
        newBalance: user.tokens + transaction.tokens
      });

      // Generate invoice PDF
      try {
        const invoiceFileName = await InvoiceService.generateInvoice(transaction, user);
        await storage.updateTransaction(transaction._id, {
          invoiceFileName
        });
        logger.info('Invoice generated successfully', {
          userId: user._id,
          transactionId: transaction.transactionId,
          invoiceFileName
        });
      } catch (invoiceError: any) {
        logger.error('Invoice generation failed', {
          error: invoiceError.message,
          userId: user._id,
          transactionId: transaction.transactionId
        });
        // Don't fail the payment if invoice generation fails
      }

      logger.info('Payment verification completed successfully', {
        userId: user._id,
        transactionId: transaction.transactionId
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        transaction: {
          id: transaction.transactionId,
          tokens: transaction.tokens,
          amount: transaction.amount,
          currency: transaction.currency
        }
      });
    } catch (error: any) {
      const user = req.user as IUser;
      logger.error('PaymentController.verifyPayment error', {
        error: error.message,
        stack: error.stack,
        userId: user?._id
      });

      res.status(500).json({ error: 'Failed to verify payment' });
    }
  }

  // Handle Razorpay webhook (for automatic payment updates)
  static async handleWebhook(req: Request, res: Response) {
    try {
      // Verify webhook signature for security
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (webhookSecret && webhookSignature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
          
        if (expectedSignature !== webhookSignature) {
          console.error('❌ Invalid webhook signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      const { event, payload } = req.body;
      console.log(`📥 Razorpay webhook received: ${event}`);

      switch (event) {
        case 'payment.captured':
          await PaymentController.handlePaymentCaptured(payload.payment.entity);
          break;
        case 'payment.failed':
          await PaymentController.handlePaymentFailed(payload.payment.entity);
          break;
        default:
          console.log(`ℹ️  Unhandled webhook event: ${event}`);
      }

      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle payment captured webhook
  private static async handlePaymentCaptured(payment: any) {
    try {
      // Find transaction by Razorpay order ID using storage
      const allTransactions = await storage.getTransactions(''); // Get all transactions (we'll filter)
      const transaction = allTransactions.find(t => t.razorpayOrderId === payment.order_id);

      if (!transaction) {
        console.warn(`⚠️  Transaction not found for order: ${payment.order_id}`);
        return;
      }

      if (transaction.status === 'completed') {
        console.log(`ℹ️  Transaction already completed: ${transaction.transactionId}`);
        return;
      }

      // Update transaction
      await storage.updateTransaction(transaction._id, {
        status: 'completed',
        razorpayPaymentId: payment.id,
        paymentMethod: payment.method
      });

      // Add tokens to user
      const user = await storage.getUser(transaction.userId.toString());
      if (user) {
        await storage.updateUser(user._id, {
          tokens: user.tokens + transaction.tokens
        });
      }

      console.log(`✅ Payment captured and tokens added: ${transaction.transactionId}`);
    } catch (error) {
      console.error('Handle payment captured error:', error);
    }
  }

  // Handle payment failed webhook
  private static async handlePaymentFailed(payment: any) {
    try {
      // Find transaction by Razorpay order ID using storage
      const allTransactions = await storage.getTransactions(''); // Get all transactions (we'll filter)
      const transaction = allTransactions.find(t => t.razorpayOrderId === payment.order_id);

      if (!transaction) {
        console.warn(`⚠️  Transaction not found for failed payment: ${payment.order_id}`);
        return;
      }

      // Update transaction status to failed
      await storage.updateTransaction(transaction._id, {
        status: 'failed',
        razorpayPaymentId: payment.id
      });

      console.log(`❌ Payment failed: ${transaction.transactionId}`);
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  // Download invoice PDF
  static async downloadInvoice(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { transactionId } = req.params;

      // Find transaction
      const transactions = await storage.getTransactions(user._id);
      const transaction = transactions.find(t => t.transactionId === transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (!transaction.invoiceFileName) {
        return res.status(404).json({ error: 'Invoice not available' });
      }

      // Check if invoice file exists
      if (!InvoiceService.invoiceExists(transaction.invoiceFileName)) {
        return res.status(404).json({ error: 'Invoice file not found' });
      }

      const filePath = InvoiceService.getInvoicePath(transaction.invoiceFileName);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${transaction.invoiceFileName}"`);

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error: any) => {
        console.error('File stream error:', error);
        res.status(500).json({ error: 'Failed to download invoice' });
      });
    } catch (error) {
      console.error('Download invoice error:', error);
      res.status(500).json({ error: 'Failed to download invoice' });
    }
  }

  // Get user's transaction history
  static async getTransactionHistory(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { page = 1, limit = 10, status } = req.query;

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

      res.json({
        transactions: sanitizedTransactions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: Number(page) * Number(limit) < total
      });
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ error: 'Failed to get transaction history' });
    }
  }
}

export default PaymentController;