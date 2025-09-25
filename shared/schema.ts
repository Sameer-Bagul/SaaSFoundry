import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// User Schema
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  company?: string;
  avatar?: string;
  tokens: number;
  apiKey?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  phone: String,
  country: String,
  company: String,
  avatar: String,
  tokens: { type: Number, default: 0 },
  apiKey: String,
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);

// Transaction Schema
export interface ITransaction extends Document {
  _id: string;
  userId: string;
  transactionId: string;
  packageName: string;
  tokens: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  invoiceFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true, ref: 'User' },
  transactionId: { type: String, required: true, unique: true },
  packageName: { type: String, required: true },
  tokens: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  paymentMethod: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  invoiceFileName: String,
}, { timestamps: true });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

// User Settings Schema
export interface IUserSettings extends Document {
  _id: string;
  userId: string;
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  tokenAlerts: boolean;
  dataAnalytics: boolean;
  marketingCommunications: boolean;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>({
  userId: { type: String, required: true, unique: true, ref: 'User' },
  theme: { type: String, default: 'system' },
  language: { type: String, default: 'en' },
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: false },
  tokenAlerts: { type: Boolean, default: true },
  dataAnalytics: { type: Boolean, default: true },
  marketingCommunications: { type: Boolean, default: false },
  rateLimit: { type: Number, default: 100 },
}, { timestamps: true });

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);

// Support Ticket Schema
export interface ISupportTicket extends Document {
  _id: string;
  userId: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
  userId: { type: String, required: true, ref: 'User' },
  subject: { type: String, required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'open' },
}, { timestamps: true });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);

// API Usage Schema
export interface IApiUsage extends Document {
  _id: string;
  userId: string;
  endpoint: string;
  method: string;
  tokensUsed: number;
  success: boolean;
  createdAt: Date;
}

const apiUsageSchema = new Schema<IApiUsage>({
  userId: { type: String, required: true, ref: 'User' },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  tokensUsed: { type: Number, required: true },
  success: { type: Boolean, required: true },
}, { timestamps: false });

export const ApiUsage = mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);

// Chat Message Schema
export interface IChatMessage extends Document {
  _id: string;
  userId: string;
  role: string;
  content: string;
  tokensUsed: number;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  userId: { type: String, required: true, ref: 'User' },
  role: { type: String, required: true },
  content: { type: String, required: true },
  tokensUsed: { type: Number, default: 0 },
}, { timestamps: true });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

// Zod Schemas
export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
});

export const insertTransactionSchema = z.object({
  userId: z.string(),
  transactionId: z.string(),
  packageName: z.string(),
  tokens: z.number(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  paymentMethod: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  invoiceFileName: z.string().optional(),
});

export const insertUserSettingsSchema = z.object({
  userId: z.string(),
  theme: z.string().optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  tokenAlerts: z.boolean().optional(),
  dataAnalytics: z.boolean().optional(),
  marketingCommunications: z.boolean().optional(),
  rateLimit: z.number().optional(),
});

export const insertSupportTicketSchema = z.object({
  userId: z.string(),
  subject: z.string(),
  category: z.string(),
  message: z.string(),
});

export const insertApiUsageSchema = z.object({
  userId: z.string(),
  endpoint: z.string(),
  method: z.string(),
  tokensUsed: z.number(),
  success: z.boolean(),
});

export const insertChatMessageSchema = z.object({
  userId: z.string(),
  role: z.string(),
  content: z.string(),
  tokensUsed: z.number().optional(),
});

// Types
export type IUserType = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ITransactionType = ITransaction;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type IUserSettingsType = IUserSettings;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type ISupportTicketType = ISupportTicket;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type IApiUsageType = IApiUsage;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type IChatMessageType = IChatMessage;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
