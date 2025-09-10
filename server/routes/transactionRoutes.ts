import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All transaction routes require authentication
router.use(requireAuth);

// Transaction routes
router.post('/', TransactionController.createTransaction);
router.get('/', TransactionController.getUserTransactions);
router.put('/:transactionId/status', TransactionController.updateTransactionStatus);
router.post('/webhook/payment', TransactionController.processPayment);

export default router;