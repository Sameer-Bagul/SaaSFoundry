import { Request, Response } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import User, { IUser } from '../models/User';
import RazorpayService from '../services/RazorpayService';

// Credit packages available for purchase
export const CREDIT_PACKAGES = {
  starter: { credits: 100, basePrice: 9.99, name: 'Starter Pack' },
  pro: { credits: 500, basePrice: 39.99, name: 'Pro Pack' },
  enterprise: { credits: 2000, basePrice: 149.99, name: 'Enterprise Pack' },
  unlimited: { credits: 10000, basePrice: 499.99, name: 'Unlimited Pack' }
};

export class PaymentController {
  // Get available credit packages with pricing for user's country
  static async getPackages(req: Request, res: Response) {
    try {
      const { country = 'US' } = req.query;
      const billingCountry = String(country).toUpperCase();

      const packages = Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => {
        const taxInfo = RazorpayService.getTaxInfo(billingCountry);
        const currency = billingCountry === 'IN' ? 'INR' : 'USD';
        
        // Convert USD to INR if needed (simplified conversion - in production, use real exchange rates)
        let basePrice = pkg.basePrice;
        if (currency === 'INR') {
          basePrice = pkg.basePrice * 83; // Approximate USD to INR conversion
        }

        const taxAmount = taxInfo.applicable ? basePrice * taxInfo.rate : 0;
        const finalPrice = basePrice + taxAmount;

        return {
          id: key,
          name: pkg.name,
          credits: pkg.credits,
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
      const { packageId, billingCountry = 'US' } = req.body;

      // Validate package
      const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
      if (!selectedPackage) {
        return res.status(400).json({ error: 'Invalid package selected' });
      }

      const country = String(billingCountry).toUpperCase();
      const currency = country === 'IN' ? 'INR' : 'USD';
      
      // Calculate pricing
      let basePrice = selectedPackage.basePrice;
      if (currency === 'INR') {
        basePrice = selectedPackage.basePrice * 83; // Convert USD to INR
      }

      const taxInfo = RazorpayService.getTaxInfo(country);
      const taxAmount = taxInfo.applicable ? basePrice * taxInfo.rate : 0;
      const finalPrice = basePrice + taxAmount;

      // Create transaction record
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction = new Transaction({
        userId: user._id,
        transactionId,
        packageName: selectedPackage.name,
        credits: selectedPackage.credits,
        originalAmount: basePrice,
        amount: finalPrice,
        currency,
        billingCountry: country,
        taxApplied: taxInfo.applicable,
        taxRate: taxInfo.rate,
        taxAmount,
        status: 'pending'
      });

      await transaction.save();

      // Create Razorpay order
      const razorpayOrder = await RazorpayService.createOrder({
        amount: finalPrice,
        currency,
        receipt: transactionId,
        billingCountry: country
      });

      // Update transaction with Razorpay order ID
      transaction.razorpayOrderId = razorpayOrder.id;
      await transaction.save();

      res.status(201).json({
        orderId: razorpayOrder.id,
        amount: finalPrice,
        currency,
        transactionId,
        package: {
          id: packageId,
          name: selectedPackage.name,
          credits: selectedPackage.credits
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
      console.error('Create order error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create payment order' 
      });
    }
  }

  // Verify payment and complete transaction
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      // Verify payment signature
      const isValidSignature = RazorpayService.verifyPaymentSignature(
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Find transaction by Razorpay order ID
      const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Update transaction as completed
      transaction.status = 'completed';
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.razorpaySignature = razorpay_signature;
      transaction.paymentMethod = 'razorpay';
      await transaction.save();

      // Add credits to user
      await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { credits: transaction.credits } }
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        transaction: {
          id: transaction.transactionId,
          credits: transaction.credits,
          amount: transaction.amount,
          currency: transaction.currency
        }
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  }

  // Handle Razorpay webhook (for automatic payment updates)
  static async handleWebhook(req: Request, res: Response) {
    try {
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
      const transaction = await Transaction.findOne({ 
        razorpayOrderId: payment.order_id 
      });

      if (!transaction) {
        console.warn(`⚠️  Transaction not found for order: ${payment.order_id}`);
        return;
      }

      if (transaction.status === 'completed') {
        console.log(`ℹ️  Transaction already completed: ${transaction.transactionId}`);
        return;
      }

      // Update transaction
      transaction.status = 'completed';
      transaction.razorpayPaymentId = payment.id;
      transaction.paymentMethod = payment.method;
      await transaction.save();

      // Add credits to user
      await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { credits: transaction.credits } }
      );

      console.log(`✅ Payment captured and credits added: ${transaction.transactionId}`);
    } catch (error) {
      console.error('Handle payment captured error:', error);
    }
  }

  // Handle payment failed webhook
  private static async handlePaymentFailed(payment: any) {
    try {
      const transaction = await Transaction.findOne({ 
        razorpayOrderId: payment.order_id 
      });

      if (!transaction) {
        console.warn(`⚠️  Transaction not found for failed payment: ${payment.order_id}`);
        return;
      }

      transaction.status = 'failed';
      transaction.razorpayPaymentId = payment.id;
      await transaction.save();

      console.log(`❌ Payment failed: ${transaction.transactionId}`);
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  // Get user's transaction history
  static async getTransactionHistory(req: Request, res: Response) {
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
        .skip((Number(page) - 1) * Number(limit))
        .select('-razorpaySignature -razorpayPaymentId'); // Hide sensitive info

      const total = await Transaction.countDocuments(filter);

      res.json({
        transactions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ error: 'Failed to get transaction history' });
    }
  }
}

export default PaymentController;