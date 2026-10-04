import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP
  message: { message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, login);
router.post('/logout', authenticateUser, logout);
router.get('/me', authenticateUser, getMe);
router.post('/change-password', authenticateUser, changePassword);

export default router;
