import { type User, type InsertUser, type Transaction, type InsertTransaction, type UserSettings, type InsertUserSettings, type SupportTicket, type InsertSupportTicket, type ApiUsage, type InsertApiUsage, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | undefined>;
  
  // Support ticket methods
  getSupportTickets(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  
  // API usage methods
  createApiUsage(usage: InsertApiUsage): Promise<ApiUsage>;
  getApiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<ApiUsage[]>;
  
  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private userSettings: Map<string, UserSettings>;
  private supportTickets: Map<string, SupportTicket>;
  private apiUsage: Map<string, ApiUsage>;
  private chatMessages: Map<string, ChatMessage>;
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
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const apiKey = `sk-${randomBytes(24).toString('hex')}`;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      apiKey,
      tokens: 0,
      isEmailVerified: false,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phone: insertUser.phone || null,
      country: insertUser.country || null,
      company: insertUser.company || null,
      avatar: insertUser.avatar || null,
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

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      paymentMethod: insertTransaction.paymentMethod || null,
      razorpayOrderId: insertTransaction.razorpayOrderId || null,
      razorpayPaymentId: insertTransaction.razorpayPaymentId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
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

// Use PostgreSQL database storage instead of memory storage
import { db } from "./db";
import { users, transactions, userSettings, supportTickets, apiUsage, chatMessages } from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const apiKey = `sk-${randomBytes(24).toString('hex')}`;
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        apiKey,
        tokens: 0,
        isEmailVerified: false,
      })
      .returning();

    // Create default settings for the user
    await this.createUserSettings({
      userId: user.id,
      theme: "system",
      language: "en",
      emailNotifications: true,
      pushNotifications: false,
      tokenAlerts: true,
      dataAnalytics: true,
      marketingCommunications: false,
      rateLimit: 100,
    });

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings || undefined;
  }

  // Support ticket methods
  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values({ ...insertTicket, status: "open" })
      .returning();
    return ticket;
  }

  // API usage methods
  async createApiUsage(insertUsage: InsertApiUsage): Promise<ApiUsage> {
    const [usage] = await db
      .insert(apiUsage)
      .values(insertUsage)
      .returning();
    return usage;
  }

  async getApiUsage(userId: string, startDate?: Date, endDate?: Date): Promise<ApiUsage[]> {
    let whereConditions = [eq(apiUsage.userId, userId)];

    if (startDate) {
      whereConditions.push(gte(apiUsage.createdAt, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(apiUsage.createdAt, endDate));
    }

    return await db
      .select()
      .from(apiUsage)
      .where(and(...whereConditions))
      .orderBy(desc(apiUsage.createdAt));
  }

  // Chat message methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
