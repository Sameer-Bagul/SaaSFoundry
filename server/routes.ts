import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTransactionSchema, insertUserSettingsSchema, insertSupportTicketSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Token packages configuration
  const tokenPackages = {
    starter: { tokens: 10, priceUSD: 20, priceINR: 1760, name: "10 Tokens Pack" },
    professional: { tokens: 50, priceUSD: 100, priceINR: 8800, name: "50 Tokens Pack" },
    enterprise: { tokens: 100, priceUSD: 200, priceINR: 17600, name: "100 Tokens Pack" }
  };

  // Get user dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    const transactions = await storage.getTransactions(user._id);
    const apiUsage = await storage.getApiUsage(user.id);

    const totalSpent = transactions
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const tokensUsed = apiUsage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const apiCalls = apiUsage.length;
    const successRate = apiUsage.length > 0 
      ? (apiUsage.filter(u => u.success).length / apiUsage.length) * 100 
      : 100;

    res.json({
      totalTokens: user.tokens,
      tokensUsed,
      apiCalls,
      successRate: successRate.toFixed(1),
      totalSpent: totalSpent.toFixed(2),
    });
  });

  // Get recent activity
  app.get("/api/dashboard/activity", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = req.user!;
    const transactions = await storage.getTransactions(user._id);
    const apiUsage = await storage.getApiUsage(user._id);

    const activity = [
      ...transactions.slice(0, 3).map(t => ({
        type: "transaction",
        title: "Tokens Purchased",
        description: `${t.tokens} tokens added to account`,
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

  // Get token packages
  app.get("/api/tokens/packages", (req, res) => {
    res.json(tokenPackages);
  });


  // Create Razorpay order
  app.post("/api/tokens/create-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { packageType, currency, customQuantity } = req.body;

    // Map frontend package types to backend package IDs
    let packageId: string;
    if (customQuantity && parseInt(customQuantity) > 0) {
      // For custom quantity, we'll handle it in the controller
      packageId = 'custom';
      req.body.packageId = packageId;
      req.body.customTokens = parseInt(customQuantity);
    } else {
      // Map frontend package types to backend IDs
      const packageMapping: { [key: string]: string } = {
        '10': '10',
        '50': '50',
        '100': '100'
      };
      packageId = packageMapping[packageType] || packageType;
      req.body.packageId = packageId;
    }

    req.body.billingCountry = currency === 'INR' ? 'IN' : 'US';

    // Use PaymentController.createOrder
    const { PaymentController } = await import('./controllers/PaymentController');
    return PaymentController.createOrder(req, res);
  });

  // Verify payment and update tokens
  app.post("/api/tokens/verify-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Map frontend field names to backend expected names
    req.body.razorpay_order_id = req.body.razorpayOrderId;
    req.body.razorpay_payment_id = req.body.razorpayPaymentId;
    req.body.razorpay_signature = req.body.razorpaySignature;

    // Use PaymentController.verifyPayment
    const { PaymentController } = await import('./controllers/PaymentController');
    return PaymentController.verifyPayment(req, res);
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
      const updatedUser = await storage.updateUser(req.user!._id, {
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

    const transactions = await storage.getTransactions(req.user!._id);
    res.json(transactions);
  });

  // Get payment summary
  app.get("/api/payments/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const transactions = await storage.getTransactions(req.user!._id);
    const completedTransactions = transactions.filter(t => t.status === "completed");

    const totalSpent = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = completedTransactions.length;
    const totalTokens = completedTransactions.reduce((sum, t) => sum + t.tokens, 0);

    res.json({
      totalSpent: totalSpent.toFixed(2),
      totalTransactions,
      totalTokens,
    });
  });

  // Get user settings
  app.get("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const settings = await storage.getUserSettings(req.user!._id);
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
      const updatedSettings = await storage.updateUserSettings(req.user!._id, updateData);

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
        userId: req.user!._id,
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

    const tickets = await storage.getSupportTickets(req.user!._id);
    res.json(tickets);
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = req.user!;
    const tokensRequired = Math.max(1, Math.floor(message.length / 100)); // 1 token per ~100 characters, minimum 1

    if (user.tokens < tokensRequired) {
      return res.status(400).json({ 
        message: `Insufficient tokens. Required: ${tokensRequired}, Available: ${user.tokens}`
      });
    }

    try {
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: user._id,
        role: "user",
        content: message,
        tokensUsed: 0,
      });

      // Simple AI response simulation (in production, replace with actual AI API call)
      const aiResponses = [
        "That's a great question! Let me help you with that.",
        "I understand what you're asking. Here's my perspective on this topic.",
        "Based on your message, I can provide some insights that might be helpful.",
        "Thank you for sharing that with me. Let me think about this and provide a thoughtful response.",
        "This is an interesting point you've raised. Let me break this down for you.",
        "I appreciate your question. Here's how I would approach this situation.",
      ];
      
      const baseResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      const aiResponse = `${baseResponse}\n\nRegarding your message: "${message.length > 100 ? message.substring(0, 100) + '...' : message}"\n\nThis is a demonstration response from the AI assistant. In a production environment, this would be replaced with actual AI processing using services like OpenAI GPT, Anthropic Claude, or similar AI models. The response would be tailored to your specific query and provide relevant, helpful information.`;

      // Save AI response
      await storage.createChatMessage({
        userId: user._id,
        role: "assistant",
        content: aiResponse,
        tokensUsed: tokensRequired,
      });

      // Deduct credits from user
      await storage.updateUser(user._id, {
        tokens: user.tokens - tokensRequired,
      });

      // Log API usage
      await storage.createApiUsage({
        userId: user._id,
        endpoint: "/api/chat",
        method: "POST",
        tokensUsed: tokensRequired,
        success: true,
      });

      res.json({
        message: aiResponse,
        tokensUsed: tokensRequired,
        remainingTokens: user.tokens - tokensRequired,
      });
    } catch (error) {
      console.error("Error processing chat:", error);
      
      // Log failed API usage
      await storage.createApiUsage({
        userId: user._id,
        endpoint: "/api/chat",
        method: "POST",
        tokensUsed: 0,
        success: false,
      });

      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await storage.getChatMessages(req.user!._id, limit);
    res.json(messages);
  });

  const httpServer = createServer(app);
  return httpServer;
}
