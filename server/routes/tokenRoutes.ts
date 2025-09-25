import express, { Router } from 'express';
import { TokenController } from '../controllers/TokenController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All token routes require authentication
router.use(requireAuth);

// Create token purchase order
router.post('/create-order', TokenController.createOrder);

// Verify payment and update tokens
router.post('/verify-payment', TokenController.verifyPayment);

// Get user's token purchase history
router.get('/history', TokenController.getHistory);

// Get user's current token balance
router.get('/balance', TokenController.getBalance);

// Get token purchase statistics
router.get('/stats', TokenController.getStats);

export default router;