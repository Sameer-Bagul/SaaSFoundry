import { type User, type InsertUser, type Transaction, type InsertTransaction, type UserSettings, type InsertUserSettings, type SupportTicket, type InsertSupportTicket, type ApiUsage, type InsertApiUsage } from "@shared/schema";
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
  
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private userSettings: Map<string, UserSettings>;
  private supportTickets: Map<string, SupportTicket>;
  private apiUsage: Map<string, ApiUsage>;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.userSettings = new Map();
    this.supportTickets = new Map();
    this.apiUsage = new Map();
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
      credits: 0,
      isEmailVerified: false,
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
      creditAlerts: true,
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
      ...insertSettings,
      id,
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
}

export const storage = new MemStorage();
