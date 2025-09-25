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
router.get('/invoice/:transactionId', PaymentController.downloadInvoice);

// Token-specific routes (for frontend compatibility)
router.post('/tokens/create-order', PaymentController.createOrder);
router.post('/tokens/verify-payment', PaymentController.verifyPayment);
router.get('/tokens/history', PaymentController.getTransactionHistory);

export default router;