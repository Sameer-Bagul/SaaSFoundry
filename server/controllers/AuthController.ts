import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import User, { IUser } from '../models/User';
import UserSettings from '../models/UserSettings';

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        tokens: 0
      });

      await user.save();

      // Create default user settings
      const userSettings = new UserSettings({
        userId: user._id
      });
      await userSettings.save();

      // Log the user in
      req.logIn(user as any, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          user: {
            id: user._id,
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
    passport.authenticate('local', (err: any, user: IUser | false, info: any) => {
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
            id: user._id,
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
      const user = req.user as IUser;
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          credits: user.credits,
          isEmailVerified: user.isEmailVerified
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
}

export default AuthController;