import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { insertUserSchema, type User } from '@shared/schema';
import { z } from 'zod';

// Validation schemas
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
  email: z.string().email('Invalid email format'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const { username, email, password, firstName, lastName } = validation.data;

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          error: 'Email already exists' 
        });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ 
          error: 'Username already exists' 
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Log the user in
      req.logIn(user as any, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            tokens: user.tokens,
            isEmailVerified: user.isEmailVerified
          }
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      passport.authenticate('local', (err: any, user: User | false, info: any) => {
        if (err) return next(err);
        
        if (!user) {
          return res.status(401).json({ 
            error: info?.message || 'Invalid credentials' 
          });
        }

        req.logIn(user as any, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          res.json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              tokens: user.tokens,
              isEmailVerified: user.isEmailVerified
            }
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Logout user
  static logout(req: Request, res: Response, next: NextFunction) {
    req.logOut((err) => {
      if (err) return next(err);
      res.json({ message: 'Logged out successfully' });
    });
  }

  // Get current user
  static getCurrentUser(req: Request, res: Response) {
    if (req.user) {
      const user = req.user as User;
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokens: user.tokens,
          isEmailVerified: user.isEmailVerified
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
}

export default AuthController;