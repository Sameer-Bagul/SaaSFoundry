import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  transactionId: string;
  packageName: string;
  credits: number;
  amount: number;
  currency: 'USD' | 'INR';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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
  credits: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
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
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
// transactionId already has unique index from field definition, no need for separate index

export default mongoose.model<ITransaction>('Transaction', transactionSchema);