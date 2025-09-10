import { Request, Response, NextFunction } from 'express';

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to require admin role (for future use)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add admin role check here when user roles are implemented
  next();
};

export default { requireAuth, requireAdmin };