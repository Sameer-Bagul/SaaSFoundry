import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { insertUserSchema, type IUserType } from '@shared/schema';
import { z } from 'zod';
import logger from '../utils/logger';
import { generateAccessToken, generateRefreshToken } from '../auth';

// Validation schemas
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  country: z.string().min(2, 'Country code must be at least 2 characters').max(3, 'Country code must be at most 3 characters'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('AuthController register attempt', { username: req.body.username, email: req.body.email });
      // Validate request body
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('AuthController register validation failed', { errors: validation.error.errors });
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const { username, email, password, firstName, lastName, phone, country } = validation.data;

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        logger.warn('AuthController register failed: Email already exists', { email });
        return res.status(400).json({
          error: 'Email already exists'
        });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        logger.warn('AuthController register failed: Username already exists', { username });
        return res.status(400).json({
          error: 'Username already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      logger.info('AuthController user created with bcrypt hashing', { username });

      // Create new user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        country: country || undefined,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info('AuthController register successful', { userId: user._id });
      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          tokens: user.tokens,
          isEmailVerified: user.isEmailVerified
        },
        accessToken,
      });
    } catch (error) {
      logger.error('AuthController registration error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('AuthController login attempt', { username: req.body.username });
      // Validate request body
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('AuthController login validation failed', { errors: validation.error.errors });
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const { username, password } = validation.data;

      // Find user by username or email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        logger.warn('AuthController login failed: User not found', { username });
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.warn('AuthController login failed: Invalid password', { username });
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info('AuthController login successful', { userId: user._id, username: user.username });
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          tokens: user.tokens,
          isEmailVerified: user.isEmailVerified
        },
        accessToken,
      });
    } catch (error) {
      logger.error('AuthController login error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Refresh access token
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
      }

      const { verifyRefreshToken } = await import('../auth');
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    } catch (error) {
      logger.error('AuthController refresh error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Logout user
  static logout(req: Request, res: Response, next: NextFunction) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  }

  // Get current user
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token' });
      }

      const token = authHeader.substring(7);
      const { verifyAccessToken } = await import('../auth');
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid access token' });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          tokens: user.tokens,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      logger.error('AuthController getCurrentUser error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
}

export default AuthController;