import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import UserSettings from '../models/UserSettings';
import bcrypt from 'bcryptjs';

export class UserController {
  // Get user profile
  static async getProfile(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const profile = await User.findById(user._id).select('-password');
      
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { firstName, lastName, phone, company, avatar } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { firstName, lastName, phone, company, avatar },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // Update password
  static async updatePassword(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const userWithPassword = await User.findById(user._id);
      if (!userWithPassword) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await userWithPassword.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password
      userWithPassword.password = newPassword;
      await userWithPassword.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }

  // Delete account
  static async deleteAccount(req: Request, res: Response) {
    try {
      const user = req.user as IUser;

      // Delete user settings
      await UserSettings.findOneAndDelete({ userId: user._id });
      
      // Delete user
      await User.findByIdAndDelete(user._id);

      // Logout user
      req.logOut((err) => {
        if (err) {
          console.error('Logout error during account deletion:', err);
        }
      });

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  // Get user settings
  static async getSettings(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      let settings = await UserSettings.findOne({ userId: user._id });

      // Create default settings if not exist
      if (!settings) {
        settings = new UserSettings({ userId: user._id });
        await settings.save();
      }

      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  }

  // Update user settings
  static async updateSettings(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const settingsData = req.body;

      const settings = await UserSettings.findOneAndUpdate(
        { userId: user._id },
        settingsData,
        { new: true, upsert: true, runValidators: true }
      );

      res.json(settings);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}

export default UserController;