import { type IUserType, type InsertUser, type ITransactionType, type InsertTransaction, type IUserSettingsType, type InsertUserSettings, type ISupportTicketType, type InsertSupportTicket, type IApiUsageType, type InsertApiUsage, type IChatMessageType, type InsertChatMessage, User as UserModel, Transaction as TransactionModel, UserSettings as UserSettingsModel, SupportTicket as SupportTicketModel, ApiUsage as ApiUsageModel, ChatMessage as ChatMessageModel } from "@shared/schema";

// Simple types for MemStorage (without Mongoose Document methods)
type MemUser = Omit<IUserType, keyof mongoose.Document> & { _id: string };
type MemTransaction = Omit<ITransactionType, keyof mongoose.Document> & { _id: string };
type MemUserSettings = Omit<IUserSettingsType, keyof mongoose.Document> & { _id: string };
type MemSupportTicket = Omit<ISupportTicketType, keyof mongoose.Document> & { _id: string };
type MemApiUsage = Omit<IApiUsageType, keyof mongoose.Document> & { _id: string };
type MemChatMessage = Omit<IChatMessageType, keyof mongoose.Document> & { _id: string };
import { randomUUID, randomBytes } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<IUserType | undefined>;
  getUserByUsername(username: string): Promise<IUserType | undefined>;
  getUserByEmail(email: string): Promise<IUserType | undefined>;
  createUser(user: InsertUser): Promise<IUserType>;
  updateUser(id: string, updates: Partial<IUserType>): Promise<IUserType | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Transaction methods
  getTransactions(userId: string): Promise<ITransactionType[]>;
  getTransaction(id: string): Promise<ITransactionType | undefined>;
  getTransactionCount(query?: any): Promise<number>;
  getTransactionsPaginated(query: any, options: { page: number; limit: number; sort: any }): Promise<ITransactionType[]>;
  createTransaction(transaction: InsertTransaction): Promise<ITransactionType>;
  updateTransaction(id: string, updates: Partial<ITransactionType>): Promise<ITransactionType | undefined>;

  // User settings methods
  getUserSettings(userId: string): Promise<IUserSettingsType | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<IUserSettingsType>;
  updateUserSettings(userId: string, updates: Partial<IUserSettingsType>): Promise<IUserSettingsType | undefined>;

  // Support ticket methods
  getSupportTickets(userId: string): Promise<ISupportTicketType[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<ISupportTicketType>;

  // API usage methods
  createApiUsage(usage: InsertApiUsage): Promise<IApiUsageType>;
  getApiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<IApiUsageType[]>;

  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<IChatMessageType>;
  getChatMessages(userId: string, limit?: number): Promise<IChatMessageType[]>;

  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<string, MemUser>;
  private transactions: Map<string, MemTransaction>;
  private userSettings: Map<string, MemUserSettings>;
  private supportTickets: Map<string, MemSupportTicket>;
  private apiUsage: Map<string, MemApiUsage>;
  private chatMessages: Map<string, MemChatMessage>;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.userSettings = new Map();
    this.supportTickets = new Map();
    this.apiUsage = new Map();
    this.chatMessages = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: string): Promise<IUserType | undefined> {
    return this.users.get(id) as IUserType | undefined;
  }

  async getUserByUsername(username: string): Promise<IUserType | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    ) as IUserType | undefined;
  }

  async getUserByEmail(email: string): Promise<IUserType | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    ) as IUserType | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<IUserType> {
    const id = randomUUID();
    const apiKey = `sk-${randomBytes(24).toString('hex')}`;
    const now = new Date();
    const user: MemUser = {
      _id: id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      phone: insertUser.phone,
      country: insertUser.country,
      company: insertUser.company,
      avatar: insertUser.avatar,
      tokens: 0,
      apiKey,
      isEmailVerified: insertUser.isEmailVerified || false,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);

    // Create default settings for the user
    await this.createUserSettings({
      userId: id,
      theme: "system",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      tokenAlerts: true,
      dataAnalytics: true,
      marketingCommunications: false,
      rateLimit: 100,
    });

    return user as IUserType;
  }

  async updateUser(id: string, updates: Partial<IUserType>): Promise<IUserType | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() } as MemUser;
    this.users.set(id, updatedUser);
    return updatedUser as IUserType;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<MemTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransaction(id: string): Promise<MemTransaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionCount(query: any = {}): Promise<number> {
    let transactions = Array.from(this.transactions.values());

    // Apply filters based on query
    if (query.userId) {
      transactions = transactions.filter(t => t.userId === query.userId);
    }
    if (query.status) {
      transactions = transactions.filter(t => t.status === query.status);
    }

    return transactions.length;
  }

  async getTransactionsPaginated(query: any, options: { page: number; limit: number; sort: any }): Promise<MemTransaction[]> {
    const { page, limit, sort } = options;
    let transactions = Array.from(this.transactions.values());

    // Apply filters based on query
    if (query.userId) {
      transactions = transactions.filter(t => t.userId === query.userId);
    }
    if (query.status) {
      transactions = transactions.filter(t => t.status === query.status);
    }

    // Apply sorting
    if (sort && sort.createdAt === -1) {
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return transactions.slice(startIndex, endIndex);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<MemTransaction> {
    const id = randomUUID();
    const now = new Date();
    const transaction: MemTransaction = {
      ...insertTransaction,
      _id: id,
      paymentMethod: insertTransaction.paymentMethod || null,
      razorpayOrderId: insertTransaction.razorpayOrderId || null,
      razorpayPaymentId: insertTransaction.razorpayPaymentId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<MemTransaction>): Promise<MemTransaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const id = randomUUID();
    const now = new Date();
    const settings: UserSettings = {
      id,
      userId: insertSettings.userId,
      theme: insertSettings.theme || "system",
      language: insertSettings.language || "en",
      emailNotifications: insertSettings.emailNotifications ?? true,
      pushNotifications: insertSettings.pushNotifications ?? false,
      tokenAlerts: insertSettings.tokenAlerts ?? true,
      dataAnalytics: insertSettings.dataAnalytics ?? true,
      marketingCommunications: insertSettings.marketingCommunications ?? false,
      rateLimit: insertSettings.rateLimit || 100,
      createdAt: now,
      updatedAt: now,
    };
    this.userSettings.set(id, settings);
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const settings = Array.from(this.userSettings.values()).find(s => s.userId === userId);
    if (!settings) return undefined;

    const updatedSettings = { ...settings, ...updates, updatedAt: new Date() };
    this.userSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  // Support ticket methods
  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const id = randomUUID();
    const now = new Date();
    const ticket: SupportTicket = {
      ...insertTicket,
      id,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  // API usage methods
  async createApiUsage(insertUsage: InsertApiUsage): Promise<ApiUsage> {
    const id = randomUUID();
    const usage: ApiUsage = {
      ...insertUsage,
      id,
      createdAt: new Date(),
    };
    this.apiUsage.set(id, usage);
    return usage;
  }

  async getApiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<ApiUsage[]> {
    let usage = Array.from(this.apiUsage.values())
      .filter(u => u.userId === userId);

    if (startDate) {
      usage = usage.filter(u => u.createdAt >= startDate);
    }
    if (endDate) {
      usage = usage.filter(u => u.createdAt <= endDate);
    }

    return usage.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Chat message methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      userId: insertMessage.userId,
      role: insertMessage.role,
      content: insertMessage.content,
      tokensUsed: insertMessage.tokensUsed || 0,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit); // Get the latest messages
  }
}

// Use MongoDB database storage instead of memory storage
import { User, Transaction, UserSettings, SupportTicket, ApiUsage, ChatMessage } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/saasfoundry',
      ttl: 24 * 60 * 60, // 1 day
    });
  }

  // User methods
  async getUser(id: string): Promise<IUserType | undefined> {
    const user = await UserModel.findById(id);
    return user ? user.toObject() : undefined;
  }

  async getUserByUsername(username: string): Promise<IUserType | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? user.toObject() : undefined;
  }

  async getUserByEmail(email: string): Promise<IUserType | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? user.toObject() : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<IUserType> {
    const apiKey = `sk-${randomBytes(24).toString('hex')}`;
    const user = new UserModel({
      ...insertUser,
      apiKey,
      tokens: 0,
      isEmailVerified: false,
    });
    const savedUser = await user.save();

    // Create default settings for the user
    await this.createUserSettings({
      userId: savedUser._id.toString(),
      theme: "system",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      tokenAlerts: true,
      dataAnalytics: true,
      marketingCommunications: false,
      rateLimit: 100,
    });

    return savedUser.toObject();
  }

  async updateUser(id: string, updates: Partial<IUserType>): Promise<IUserType | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    return user ? user.toObject() : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<ITransactionType[]> {
    const transactions = await TransactionModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return transactions;
  }

  async getTransaction(id: string): Promise<ITransactionType | undefined> {
    const transaction = await TransactionModel.findById(id);
    return transaction ? transaction.toObject() : undefined;
  }

  async getTransactionCount(query: any = {}): Promise<number> {
    return await TransactionModel.countDocuments(query);
  }

  async getTransactionsPaginated(query: any, options: { page: number; limit: number; sort: any }): Promise<ITransactionType[]> {
    const { page, limit, sort } = options;
    const skip = (page - 1) * limit;

    const transactions = await TransactionModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return transactions;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<ITransactionType> {
    const transaction = new TransactionModel(insertTransaction);
    const savedTransaction = await transaction.save();
    return savedTransaction.toObject();
  }

  async updateTransaction(id: string, updates: Partial<ITransactionType>): Promise<ITransactionType | undefined> {
    const transaction = await TransactionModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    return transaction ? transaction.toObject() : undefined;
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<IUserSettingsType | undefined> {
    const settings = await UserSettingsModel.findOne({ userId });
    return settings ? settings.toObject() : undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<IUserSettingsType> {
    const settings = new UserSettingsModel(insertSettings);
    const savedSettings = await settings.save();
    return savedSettings.toObject();
  }

  async updateUserSettings(userId: string, updates: Partial<IUserSettingsType>): Promise<IUserSettingsType | undefined> {
    const settings = await UserSettingsModel.findOneAndUpdate({ userId }, { ...updates, updatedAt: new Date() }, { new: true });
    return settings ? settings.toObject() : undefined;
  }

  // Support ticket methods
  async getSupportTickets(userId: string): Promise<ISupportTicketType[]> {
    const tickets = await SupportTicketModel.find({ userId }).sort({ createdAt: -1 });
    return tickets.map(t => t.toObject());
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<ISupportTicketType> {
    const ticket = new SupportTicketModel({ ...insertTicket, status: "open" });
    const savedTicket = await ticket.save();
    return savedTicket.toObject();
  }

  // API usage methods
  async createApiUsage(insertUsage: InsertApiUsage): Promise<IApiUsageType> {
    const usage = new ApiUsageModel(insertUsage);
    const savedUsage = await usage.save();
    return savedUsage.toObject();
  }

  async getApiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<IApiUsageType[]> {
    const query: any = { userId };
    if (startDate) query.createdAt = { $gte: startDate };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };

    const usages = await ApiUsageModel.find(query).sort({ createdAt: -1 });
    return usages.map(u => u.toObject());
  }

  // Chat message methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<IChatMessageType> {
    const message = new ChatMessageModel(insertMessage);
    const savedMessage = await message.save();
    return savedMessage.toObject();
  }

  async getChatMessages(userId: string, limit: number = 50): Promise<IChatMessageType[]> {
    const messages = await ChatMessageModel.find({ userId }).sort({ createdAt: 1 }).limit(limit);
    return messages.map(m => m.toObject());
  }
}

export const storage = new DatabaseStorage();
