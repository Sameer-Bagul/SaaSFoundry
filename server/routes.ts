import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTransactionSchema, insertUserSettingsSchema, insertSupportTicketSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Credit packages configuration
  const creditPackages = {
    starter: { credits: 1000, priceUSD: 10, priceINR: 800, name: "Starter Pack" },
    professional: { credits: 5000, priceUSD: 45, priceINR: 3600, name: "Professional Pack" },
    enterprise: { credits: 10000, priceUSD: 80, priceINR: 6400, name: "Enterprise Pack" }
  };

  // Get user dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    const transactions = await storage.getTransactions(user.id);
    const apiUsage = await storage.getApiUsage(user.id);

    const totalSpent = transactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const creditsUsed = apiUsage.reduce((sum, u) => sum + u.creditsUsed, 0);
    const apiCalls = apiUsage.length;
    const successRate = apiUsage.length > 0 
      ? (apiUsage.filter(u => u.success).length / apiUsage.length) * 100 
      : 100;

    res.json({
      totalCredits: user.credits,
      creditsUsed,
      apiCalls,
      successRate: successRate.toFixed(1),
      totalSpent: totalSpent.toFixed(2),
    });
  });

  // Get recent activity
  app.get("/api/dashboard/activity", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    const transactions = await storage.getTransactions(user.id);
    const apiUsage = await storage.getApiUsage(user.id);

    const activity = [
      ...transactions.slice(0, 3).map(t => ({
        type: "transaction",
        title: "Credits Purchased",
        description: `${t.credits} credits added to account`,
        time: t.createdAt,
        icon: "account_balance_wallet",
      })),
      ...apiUsage.slice(0, 2).map(u => ({
        type: "api_usage",
        title: "AI Analysis Completed",
        description: `${u.endpoint} processed successfully`,
        time: u.createdAt,
        icon: "psychology",
      }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

    res.json(activity);
  });

  // Get credit packages
  app.get("/api/credits/packages", (req, res) => {
    res.json(creditPackages);
  });

  // Create Razorpay order
  app.post("/api/credits/create-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { packageType, currency } = req.body;
    
    if (!creditPackages[packageType as keyof typeof creditPackages]) {
      return res.status(400).json({ message: "Invalid package type" });
    }

    const pkg = creditPackages[packageType as keyof typeof creditPackages];
    const amount = currency === "INR" ? pkg.priceINR : pkg.priceUSD;

    try {
      // In a real implementation, you would use the Razorpay SDK here
      const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
      
      // Create pending transaction
      await storage.createTransaction({
        userId: req.user!.id,
        transactionId: `txn_${crypto.randomBytes(12).toString('hex')}`,
        packageName: pkg.name,
        credits: pkg.credits,
        amount: amount.toString(),
        currency,
        status: "pending",
        paymentMethod: "razorpay",
        razorpayOrderId: orderId,
        razorpayPaymentId: null,
      });

      res.json({
        orderId,
        amount: amount * 100, // Razorpay expects amount in paise/cents
        currency,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Verify payment and update credits
  app.post("/api/credits/verify-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    try {
      // In a real implementation, you would verify the signature with Razorpay
      // For now, we'll simulate successful verification
      
      const transaction = await storage.getTransactions(req.user!.id);
      const pendingTransaction = transaction.find(t => 
        t.razorpayOrderId === razorpayOrderId && t.status === "pending"
      );

      if (!pendingTransaction) {
        return res.status(400).json({ message: "Transaction not found" });
      }

      // Update transaction status
      await storage.updateTransaction(pendingTransaction.id, {
        status: "completed",
        razorpayPaymentId,
      });

      // Add credits to user
      const user = req.user!;
      await storage.updateUser(user.id, {
        credits: user.credits + pendingTransaction.credits,
      });

      res.json({ message: "Payment verified and credits added successfully" });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Get user profile
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user!;
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { firstName, lastName, email, phone, company } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, {
        firstName,
        lastName,
        email,
        phone,
        company,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get payment history
  app.get("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const transactions = await storage.getTransactions(req.user!.id);
    res.json(transactions);
  });

  // Get payment summary
  app.get("/api/payments/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const transactions = await storage.getTransactions(req.user!.id);
    const completedTransactions = transactions.filter(t => t.status === "completed");

    const totalSpent = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalTransactions = completedTransactions.length;
    const totalCredits = completedTransactions.reduce((sum, t) => sum + t.credits, 0);

    res.json({
      totalSpent: totalSpent.toFixed(2),
      totalTransactions,
      totalCredits,
    });
  });

  // Get user settings
  app.get("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const settings = await storage.getUserSettings(req.user!.id);
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(settings);
  });

  // Update user settings
  app.patch("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const updateData = insertUserSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateUserSettings(req.user!.id, updateData);

      if (!updatedSettings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Create support ticket
  app.post("/api/support/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Get support tickets
  app.get("/api/support/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const tickets = await storage.getSupportTickets(req.user!.id);
    res.json(tickets);
  });

  const httpServer = createServer(app);
  return httpServer;
}
