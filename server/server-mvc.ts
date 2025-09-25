import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from './config/environment';
import { setupVite, serveStatic, log } from "./vite";
import { storage } from './storage';
import { type IUserType } from '@shared/schema';
import { connectDB } from './db';
import { requireAuth } from './middleware/auth';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import supportRoutes from './routes/supportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import tokenRoutes from './routes/tokenRoutes';

// Create Express app
const app = express();

// Trust proxy for Replit environment (important for session cookies)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tokens', tokenRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    // Check if mongoose connection is ready (1 = connected)
    const readyState = mongoose.connection.readyState;
    console.log('Health check - Database connection readyState:', readyState);
    dbStatus = readyState === 1 ? 'connected' : 'disconnected';
  } catch (error) {
    console.log('Health check - Database connection test error:', error);
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'running',
    database: {
      mongodb: dbStatus,
      url: process.env.MONGODB_URL ? 'configured' : 'not configured'
    },
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error('Error:', err);
  res.status(status).json({ message });
});

// Start server with MongoDB connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Test MongoDB connection
    let isDbConnected = false;
    try {
      // Check if mongoose connection is ready (1 = connected, 2 = connecting)
      const readyState = mongoose.connection.readyState;
      isDbConnected = readyState === 1 || readyState === 2;
    } catch (error) {
      isDbConnected = false;
    }

    // Create HTTP server
    const server = app.listen({
      port: config.port,
      host: "0.0.0.0",
      reusePort: true,
    });

    // Setup Vite in development
    if (config.isDevelopment) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    log(`🚀 Server running on port ${config.port}`);
    log(`📄 Environment: ${config.nodeEnv}`);

    if (isDbConnected) {
      log(`🗄️  Database: Connected to MongoDB`);
    } else {
      log(`⚠️  Database: Connection pending - API routes may return errors until fully connected`);
    }

    return server;
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Start the server (ES module compatible check)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };