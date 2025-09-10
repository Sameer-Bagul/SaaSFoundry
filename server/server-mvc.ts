import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import mongoose from 'mongoose';
import connectDB from './config/database';
import { config } from './config/environment';
import { setupVite, serveStatic, log } from "./vite";

// Import models
import User, { IUser } from './models/User';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import supportRoutes from './routes/supportRoutes';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'username'
  },
  async (username: string, password: string, done) => {
    try {
      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      });

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      return done(null, user as any);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user as any);
  } catch (error) {
    done(error, null);
  }
});

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = (() => {
    switch (mongoose.connection.readyState) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  })();

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'running',
    database: {
      mongodb: mongoStatus,
      url: config.mongodbUrl ? 'configured' : 'not configured'
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
    // Try to connect to MongoDB (non-fatal)
    const isDbConnected = await connectDB(config.mongodbUrl);

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
      log(`⚠️  Database: Not connected - API routes will return errors until database is configured`);
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