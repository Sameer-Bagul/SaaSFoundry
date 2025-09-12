import express, { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/packages', PaymentController.getPackages);
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook); // Razorpay webhook

// Protected routes (require authentication)
router.use(requireAuth);

router.post('/create-order', PaymentController.createOrder);
router.post('/verify', PaymentController.verifyPayment);
router.get('/history', PaymentController.getTransactionHistory);

export default router;