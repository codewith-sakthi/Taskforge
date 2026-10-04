"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_js_1 = require("../controllers/task.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticateUser);
// Completed Tasks report (Admin & Members)
router.get('/completed/report', task_controller_js_1.getCompletedTasksReport);
// List tasks (Filtered automatically inside controller for Members vs Admin)
router.get('/', task_controller_js_1.getTasks);
router.get('/my', task_controller_js_1.getMyTasks);
// Admin only: create task & update task structure
router.post('/', auth_middleware_js_1.requireAdmin, task_controller_js_1.createTask);
router.put('/:id', auth_middleware_js_1.requireAdmin, task_controller_js_1.updateTask);
// Shared (with ownership verification inside controller)
router.get('/:id', task_controller_js_1.getTaskById);
router.patch('/:id/progress', task_controller_js_1.updateTaskProgress);
router.patch('/:id/status', task_controller_js_1.updateTaskStatus);
router.post('/:id/comments', task_controller_js_1.addTaskComment);
exports.default = router;
