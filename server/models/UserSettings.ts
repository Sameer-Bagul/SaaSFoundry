import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  creditAlerts: boolean;
  dataAnalytics: boolean;
  marketingCommunications: boolean;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  language: {
    type: String,
    default: 'en'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: false
  },
  creditAlerts: {
    type: Boolean,
    default: true
  },
  dataAnalytics: {
    type: Boolean,
    default: true
  },
  marketingCommunications: {
    type: Boolean,
    default: false
  },
  rateLimit: {
    type: Number,
    default: 100,
    min: 1
  }
}, {
  timestamps: true
});

const UserSettings = mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
export default UserSettings;