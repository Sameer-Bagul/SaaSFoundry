import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.updatePassword);
router.delete('/profile', UserController.deleteAccount);

// User settings routes
router.get('/settings', UserController.getSettings);
router.put('/settings', UserController.updateSettings);

export default router;