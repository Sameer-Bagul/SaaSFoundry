import { Router } from 'express';
import { SupportController } from '../controllers/SupportController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All support routes require authentication
router.use(requireAuth);

// User support ticket routes
router.post('/', SupportController.createTicket);
router.get('/', SupportController.getUserTickets);
router.get('/:ticketId', SupportController.getTicket);

// Admin routes
router.get('/admin/tickets', requireAdmin, SupportController.getAllTickets);
router.put('/admin/:ticketId/status', requireAdmin, SupportController.updateTicketStatus);

export default router;