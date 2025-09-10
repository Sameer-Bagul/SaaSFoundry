import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// Authentication routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/user', AuthController.getCurrentUser);

export default router;