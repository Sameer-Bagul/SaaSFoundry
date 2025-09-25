import jwt from 'jsonwebtoken';
import { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { storage } from './storage';
import { IUser as SelectUser } from '@shared/schema';
import logger from './utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

async function hashPassword(password: string) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

export function generateAccessToken(user: SelectUser): string {
  return jwt.sign(
    { userId: user._id, username: user.username },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user: SelectUser): string {
  return jwt.sign(
    { userId: user._id, username: user.username },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
    return { userId: decoded.userId, username: decoded.username };
  } catch (error) {
    logger.warn('Access token verification failed', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    return { userId: decoded.userId, username: decoded.username };
  } catch (error) {
    logger.warn('Refresh token verification failed', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export function setupAuth(app: Express) {
  app.use(cookieParser());

  // Register
  app.post('/api/register', async (req: Request, res: Response) => {
    logger.info('Registration attempt', { username: req.body.username, email: req.body.email });
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.warn('Registration failed: Username already exists', { username: req.body.username });
        return res.status(400).send('Username already exists');
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
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

      logger.info('Registration successful', { userId: user._id });
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
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
      });
    } catch (error) {
      logger.error('Registration error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        logger.warn('Login failed: Invalid credentials', { username });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info('Login successful', { userId: user._id, username: user.username });
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
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
      });
    } catch (error) {
      logger.error('Login error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Refresh token
  app.post('/api/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      logger.error('Refresh token error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Token refresh failed' });
    }
  });

  // Logout
  app.post('/api/logout', (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token' });
      }

      const token = authHeader.substring(7);
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
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      logger.error('Get user error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: 'Failed to get user' });
    }
  });
}
