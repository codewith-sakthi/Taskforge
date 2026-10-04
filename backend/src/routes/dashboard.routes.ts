import { Router } from 'express';
import {
  getAdminDashboardStats,
  getMemberDashboardStats,
} from '../controllers/dashboard.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/admin', requireAdmin, getAdminDashboardStats);
router.get('/member', getMemberDashboardStats);

export default router;
