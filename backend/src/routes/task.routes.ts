import { Router } from 'express';
import {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskProgress,
  updateTaskStatus,
  addTaskComment,
  getCompletedTasksReport,
} from '../controllers/task.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

// Completed Tasks report (Admin & Members)
router.get('/completed/report', getCompletedTasksReport);

// List tasks (Filtered automatically inside controller for Members vs Admin)
router.get('/', getTasks);
router.get('/my', getMyTasks);


// Admin only: create task & update task structure
router.post('/', requireAdmin, createTask);
router.put('/:id', requireAdmin, updateTask);

// Shared (with ownership verification inside controller)
router.get('/:id', getTaskById);
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addTaskComment);

export default router;
