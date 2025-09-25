import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsage extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  tokensUsed: number;
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
  tokensUsed: {
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

const ApiUsage = mongoose.models.ApiUsage || mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);
export default ApiUsage;