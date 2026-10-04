import { Router } from 'express';
import { getActivityLogs } from '../controllers/activity.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);
router.get('/', getActivityLogs);

export default router;
