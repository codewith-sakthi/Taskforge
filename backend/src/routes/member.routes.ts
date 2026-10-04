import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  toggleMemberStatus,
  resetMemberPassword,
  updateProfile,
} from '../controllers/member.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All member routes require authentication
router.use(authenticateUser);

// Member self profile update
router.put('/profile', updateProfile);

// Admin only routes
router.get('/', requireAdmin, getMembers);
router.post('/', requireAdmin, createMember);
router.get('/:id', requireAdmin, getMemberById);
router.put('/:id', requireAdmin, updateMember);
router.patch('/:id/status', requireAdmin, toggleMemberStatus);
router.post('/:id/reset-password', requireAdmin, resetMemberPassword);

export default router;
