import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/environment';

// Type definitions for Razorpay (since @types/razorpay doesn't exist)
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
}

interface CreateOrderOptions {
  amount: number;
  currency: 'INR' | 'USD';
  receipt: string;
  billingCountry: string;
}

export class RazorpayService {
  private razorpay: any;

  constructor() {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      console.warn('⚠️  Razorpay credentials not configured. Payment features will be disabled.');
      return;
    }

    this.razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }

  // Create order with appropriate currency based on billing country
  async createOrder(options: CreateOrderOptions): Promise<RazorpayOrder> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    // Determine currency based on billing country
    const currency = this.getCurrencyByCountry(options.billingCountry);
    
    // Calculate amount with taxes if applicable
    const finalAmount = this.calculateAmountWithTax(options.amount, options.billingCountry);

    const orderOptions = {
      amount: Math.round(finalAmount * 100), // Amount in smallest currency unit (paise for INR, cents for USD)
      currency,
      receipt: options.receipt,
      notes: {
        billing_country: options.billingCountry,
        original_amount: options.amount,
        tax_applied: finalAmount !== options.amount
      }
    };

    try {
      const order = await this.razorpay.orders.create(orderOptions);
      console.log(`✅ Razorpay order created: ${order.id} for ${currency} ${finalAmount}`);
      return order;
    } catch (error: any) {
      console.error('❌ Razorpay order creation failed:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  // Verify payment signature for security
  verifyPaymentSignature(paymentId: string, orderId: string, signature: string): boolean {
    if (!config.razorpayKeySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  // Get currency based on billing country
  private getCurrencyByCountry(billingCountry: string): 'INR' | 'USD' {
    const country = billingCountry.toUpperCase();
    
    // India uses INR
    if (country === 'IN' || country === 'INDIA') {
      return 'INR';
    }
    
    // All other countries use USD
    return 'USD';
  }

  // Calculate amount with tax (GST for India)
  private calculateAmountWithTax(amount: number, billingCountry: string): number {
    const country = billingCountry.toUpperCase();
    
    // Add 18% GST for Indian customers
    if (country === 'IN' || country === 'INDIA') {
      return amount * 1.18; // 18% GST
    }
    
    // No tax for international customers
    return amount;
  }

  // Get supported currencies
  getSupportedCurrencies(): Array<{ code: string; symbol: string; name: string }> {
    return [
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'USD', symbol: '$', name: 'US Dollar' }
    ];
  }

  // Get tax info for country
  getTaxInfo(billingCountry: string): { rate: number; name: string; applicable: boolean } {
    const country = billingCountry.toUpperCase();
    
    if (country === 'IN' || country === 'INDIA') {
      return {
        rate: 0.18,
        name: 'GST',
        applicable: true
      };
    }
    
    return {
      rate: 0,
      name: 'No Tax',
      applicable: false
    };
  }

  // Format amount with currency symbol
  formatAmount(amount: number, currency: 'INR' | 'USD'): string {
    const symbols = { INR: '₹', USD: '$' };
    return `${symbols[currency]}${amount.toFixed(2)}`;
  }

  // Detect country by IP (basic implementation)
  static detectCountryByIP(ip: string): string {
    // This is a basic implementation - in production, use a proper IP geolocation service
    // For now, return a default country
    return 'US'; // Default to US
  }
}

export default new RazorpayService();