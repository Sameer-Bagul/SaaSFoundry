import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { config } from './config/environment';
import { setupVite, serveStatic, log } from "./vite";
import { storage } from './storage';
import { type User } from '@shared/schema';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import supportRoutes from './routes/supportRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Create Express app
const app = express();

// Trust proxy for Replit environment (important for session cookies)
app.set('trust proxy', 1);

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
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Important for cross-origin requests in development
    httpOnly: true // Security: prevent XSS attacks
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
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Verify password using bcrypt
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      
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
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (user) {
      // Remove password from user object for security
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as any);
    } else {
      done(null, false);
    }
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
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    // Test database connection by attempting a simple query
    await storage.getUser('test'); // This will fail gracefully if DB is down
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'running',
    database: {
      postgresql: dbStatus,
      url: process.env.DATABASE_URL ? 'configured' : 'not configured'
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

// Start server with PostgreSQL connection
const startServer = async () => {
  try {
    // Test PostgreSQL connection
    let isDbConnected = false;
    try {
      await storage.getUser('test'); // Test connection
      isDbConnected = true;
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
      log(`🗄️  Database: Connected to PostgreSQL`);
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