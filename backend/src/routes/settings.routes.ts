import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', getSettings);
router.put('/', requireAdmin, updateSettings);

export default router;
