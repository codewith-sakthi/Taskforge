import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyTodayCheckIn,
  getAllCheckIns,
} from '../controllers/checkin.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

// Member routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyTodayCheckIn);

// Admin route
router.get('/', requireAdmin, getAllCheckIns);

export default router;
