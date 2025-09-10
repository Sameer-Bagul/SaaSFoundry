import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['technical', 'billing', 'feature-request', 'bug-report', 'general']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Index for faster queries
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

export default mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);