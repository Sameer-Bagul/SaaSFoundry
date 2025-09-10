import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsage extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  creditsUsed: number;
  success: boolean;
  createdAt: Date;
}

const apiUsageSchema = new Schema<IApiUsage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },
  success: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: { updatedAt: false }
});

// Index for faster queries
apiUsageSchema.index({ userId: 1, createdAt: -1 });
apiUsageSchema.index({ endpoint: 1 });

export default mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);