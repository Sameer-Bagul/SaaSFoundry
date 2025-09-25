import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  transactionId: string;
  packageName: string;
  tokens: number;
  amount: number;
  originalAmount: number; // Amount before tax
  currency: 'USD' | 'INR';
  billingCountry: string;
  taxApplied: boolean;
  taxRate: number;
  taxAmount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  invoiceFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  tokens: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'INR'],
    default: 'USD'
  },
  billingCountry: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 2
  },
  taxApplied: {
    type: Boolean,
    default: false
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'pending', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  invoiceFileName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ createdAt: -1 });
// transactionId already has unique index from field definition, no need for separate index

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;