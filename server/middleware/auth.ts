import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth';
import { storage } from '../storage';
import logger from '../utils/logger';

// Middleware to require authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Auth middleware: No authorization header', { path: req.path, method: req.method });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      logger.warn('Auth middleware: Invalid token', { path: req.path, method: req.method });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      logger.warn('Auth middleware: User not found', { userId: decoded.userId, path: req.path, method: req.method });
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    logger.debug('Auth middleware: User authenticated', { userId: user._id });
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to require admin role (for future use)
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await requireAuth(req, res, (err?: any) => {
    if (err || !req.user) return;

    // Add admin role check here when user roles are implemented
    next();
  });
};

export default { requireAuth, requireAdmin };