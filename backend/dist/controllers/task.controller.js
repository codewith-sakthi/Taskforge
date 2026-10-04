"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletedTasksReport = exports.addTaskComment = exports.updateTaskStatus = exports.updateTaskProgress = exports.updateTask = exports.createTask = exports.getTaskById = exports.getMyTasks = exports.getTasks = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const task_validator_js_1 = require("../validators/task.validator.js");
const activity_js_1 = require("../utils/activity.js");
const index_js_1 = require("../socket/index.js");
const getTasks = async (req, res, next) => {
    try {
        const { assignedTo, priority, status, search, category } = req.query;
        const user = req.user;
        const where = {};
        // Security rule: Non-admin can ONLY view tasks assigned to them
        if (user.role !== 'ADMIN') {
            where.assignedTo = user.id;
        }
        else if (assignedTo && typeof assignedTo === 'string') {
            where.assignedTo = assignedTo;
        }
        if (priority && typeof priority === 'string') {
            where.priority = priority;
        }
        if (status && typeof status === 'string') {
            where.status = status;
        }
        if (category && typeof category === 'string') {
            where.category = category;
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }
        // Auto-evaluate overdue status on query
        const now = new Date();
        const tasks = await prisma_js_1.default.task.findMany({
            where,
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { updates: true },
                },
            },
            orderBy: [
                { status: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' },
            ],
        });
        const updatedTasks = tasks.map((task) => {
            const isOverdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < now;
            return {
                ...task,
                isOverdue,
                status: isOverdue && task.status !== 'COMPLETED' ? 'OVERDUE' : task.status,
            };
        });
        res.json({ tasks: updatedTasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
const getMyTasks = async (req, res, next) => {
    try {
        const user = req.user;
        const { status, filter } = req.query;
        const where = {
            assignedTo: user.id,
        };
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (status && typeof status === 'string') {
            where.status = status;
        }
        if (filter === 'today') {
            where.dueDate = {
                gte: todayStart,
                lte: todayEnd,
            };
        }
        else if (filter === 'upcoming') {
            where.dueDate = {
                gt: todayEnd,
            };
            where.status = { not: 'COMPLETED' };
        }
        else if (filter === 'overdue') {
            where.dueDate = {
                lt: todayStart,
            };
            where.status = { not: 'COMPLETED' };
        }
        else if (filter === 'completed') {
            where.status = 'COMPLETED';
        }
        const tasks = await prisma_js_1.default.task.findMany({
            where,
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { updates: true },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        const formattedTasks = tasks.map((t) => {
            const isOverdue = t.status !== 'COMPLETED' && new Date(t.dueDate) < now;
            return {
                ...t,
                isOverdue,
                status: isOverdue && t.status !== 'COMPLETED' ? 'OVERDUE' : t.status,
            };
        });
        res.json({ tasks: formattedTasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTasks = getMyTasks;
const getTaskById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const task = await prisma_js_1.default.task.findUnique({
            where: { id },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                updates: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Security check: Member can only view their own task
        if (user.role !== 'ADMIN' && task.assignedTo !== user.id) {
            res.status(403).json({ message: 'Access denied. You can only view tasks assigned to you.' });
            return;
        }
        const now = new Date();
        const isOverdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < now;
        res.json({
            task: {
                ...task,
                isOverdue,
                status: isOverdue && task.status !== 'COMPLETED' ? 'OVERDUE' : task.status,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res, next) => {
    try {
        const data = task_validator_js_1.createTaskSchema.parse(req.body);
        const creatorId = req.user.id;
        // Check assigned user exists
        const assignee = await prisma_js_1.default.user.findUnique({
            where: { id: data.assignedTo },
        });
        if (!assignee) {
            res.status(404).json({ message: 'Assigned team member not found' });
            return;
        }
        if (assignee.status === 'INACTIVE') {
            res.status(400).json({ message: 'Cannot assign tasks to a deactivated team member' });
            return;
        }
        const task = await prisma_js_1.default.task.create({
            data: {
                title: data.title,
                description: data.description,
                assignedTo: data.assignedTo,
                createdBy: creatorId,
                priority: data.priority,
                category: data.category || 'General',
                status: 'PENDING',
                progress: 0,
                startDate: new Date(data.startDate),
                dueDate: new Date(data.dueDate),
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Create initial timeline record
        await prisma_js_1.default.taskUpdate.create({
            data: {
                taskId: task.id,
                userId: creatorId,
                progress: 0,
                comment: `Task created and assigned to ${assignee.name}`,
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: creatorId,
            action: 'TASK_CREATED',
            description: `Admin created and assigned task "${task.title}" to ${assignee.name}`,
        });
        // Notify assigned member
        await (0, activity_js_1.createNotification)({
            userId: assignee.id,
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${task.title}" (Priority: ${task.priority})`,
        });
        (0, index_js_1.emitToAdmin)('task:created', task);
        (0, index_js_1.emitToUser)(assignee.id, 'task:assigned', task);
        res.status(201).json({
            message: 'Task created and assigned successfully',
            task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
const updateTask = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = task_validator_js_1.updateTaskSchema.parse(req.body);
        const user = req.user;
        const existingTask = await prisma_js_1.default.task.findUnique({
            where: { id },
            include: { assignedUser: true },
        });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.category !== undefined)
            updateData.category = data.category;
        if (data.startDate !== undefined)
            updateData.startDate = new Date(data.startDate);
        if (data.dueDate !== undefined)
            updateData.dueDate = new Date(data.dueDate);
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.progress !== undefined)
            updateData.progress = data.progress;
        // Check reassignment
        let reassigned = false;
        if (data.assignedTo && data.assignedTo !== existingTask.assignedTo) {
            const newAssignee = await prisma_js_1.default.user.findUnique({
                where: { id: data.assignedTo },
            });
            if (!newAssignee) {
                res.status(404).json({ message: 'New assigned member not found' });
                return;
            }
            updateData.assignedTo = data.assignedTo;
            reassigned = true;
        }
        const updatedTask = await prisma_js_1.default.task.update({
            where: { id },
            data: updateData,
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (reassigned) {
            await (0, activity_js_1.logActivity)({
                userId: user.id,
                action: 'TASK_REASSIGNED',
                description: `Task "${updatedTask.title}" was reassigned to ${updatedTask.assignedUser.name}`,
            });
            await (0, activity_js_1.createNotification)({
                userId: updatedTask.assignedTo,
                title: 'Task Assigned to You',
                message: `You were assigned the task: "${updatedTask.title}"`,
            });
            (0, index_js_1.emitToUser)(updatedTask.assignedTo, 'task:assigned', updatedTask);
        }
        else {
            await (0, activity_js_1.logActivity)({
                userId: user.id,
                action: 'TASK_UPDATED',
                description: `Task "${updatedTask.title}" details were updated`,
            });
        }
        (0, index_js_1.emitToAdmin)('task:updated', updatedTask);
        (0, index_js_1.emitToUser)(updatedTask.assignedTo, 'task:updated', updatedTask);
        res.json({
            message: 'Task updated successfully',
            task: updatedTask,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
const updateTaskProgress = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { progress, comment } = task_validator_js_1.updateTaskProgressSchema.parse(req.body);
        const user = req.user;
        const task = await prisma_js_1.default.task.findUnique({
            where: { id },
            include: { assignedUser: true },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check permission
        if (user.role !== 'ADMIN' && task.assignedTo !== user.id) {
            res.status(403).json({ message: 'You are only authorized to update your own tasks' });
            return;
        }
        let newStatus = task.status;
        if (progress === 100) {
            newStatus = 'COMPLETED';
        }
        else if (progress > 0 && task.status === 'PENDING') {
            newStatus = 'IN_PROGRESS';
        }
        const updatedTask = await prisma_js_1.default.task.update({
            where: { id },
            data: {
                progress,
                status: newStatus,
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const updateComment = comment || (progress === 100 ? 'Completed task (100%)' : `Updated progress to ${progress}%`);
        const taskUpdate = await prisma_js_1.default.taskUpdate.create({
            data: {
                taskId: id,
                userId: user.id,
                progress,
                comment: updateComment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        const action = progress === 100 ? 'TASK_COMPLETED' : 'TASK_PROGRESS_CHANGED';
        const actionDesc = progress === 100
            ? `${user.name} marked task "${task.title}" as completed`
            : `${user.name} updated "${task.title}" progress to ${progress}%`;
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action,
            description: actionDesc,
        });
        if (progress === 100) {
            const admins = await prisma_js_1.default.user.findMany({ where: { role: 'ADMIN' } });
            for (const admin of admins) {
                await (0, activity_js_1.createNotification)({
                    userId: admin.id,
                    title: 'Task Completed',
                    message: `${user.name} completed "${task.title}"`,
                });
            }
        }
        (0, index_js_1.emitToAdmin)('task:progress_changed', { task: updatedTask, update: taskUpdate });
        (0, index_js_1.emitToUser)(task.assignedTo, 'task:progress_changed', { task: updatedTask, update: taskUpdate });
        res.json({
            message: 'Task progress updated successfully',
            task: updatedTask,
            update: taskUpdate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskProgress = updateTaskProgress;
const updateTaskStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status, comment } = task_validator_js_1.updateTaskStatusSchema.parse(req.body);
        const user = req.user;
        const task = await prisma_js_1.default.task.findUnique({
            where: { id },
            include: { assignedUser: true },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        if (user.role !== 'ADMIN' && task.assignedTo !== user.id) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        let progress = task.progress;
        if (status === 'COMPLETED' && progress < 100) {
            progress = 100;
        }
        else if (status === 'PENDING') {
            progress = 0;
        }
        const updatedTask = await prisma_js_1.default.task.update({
            where: { id },
            data: {
                status,
                progress,
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const statusComment = comment || `Changed status to ${status.replace('_', ' ')}`;
        const taskUpdate = await prisma_js_1.default.taskUpdate.create({
            data: {
                taskId: id,
                userId: user.id,
                progress,
                comment: statusComment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'TASK_STATUS_CHANGED',
            description: `${user.name} changed status of "${task.title}" to ${status}`,
        });
        (0, index_js_1.emitToAdmin)('task:status_changed', { task: updatedTask, update: taskUpdate });
        (0, index_js_1.emitToUser)(task.assignedTo, 'task:status_changed', { task: updatedTask, update: taskUpdate });
        res.json({
            message: 'Task status updated successfully',
            task: updatedTask,
            update: taskUpdate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskStatus = updateTaskStatus;
const addTaskComment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { comment, progress } = task_validator_js_1.addTaskCommentSchema.parse(req.body);
        const user = req.user;
        const task = await prisma_js_1.default.task.findUnique({
            where: { id },
            include: { assignedUser: true },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        if (user.role !== 'ADMIN' && task.assignedTo !== user.id) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        const currentProgress = progress !== undefined ? progress : task.progress;
        let newStatus = task.status;
        if (currentProgress === 100) {
            newStatus = 'COMPLETED';
        }
        else if (currentProgress > 0 && task.status === 'PENDING') {
            newStatus = 'IN_PROGRESS';
        }
        const updatedTask = await prisma_js_1.default.task.update({
            where: { id },
            data: {
                progress: currentProgress,
                status: newStatus,
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        const taskUpdate = await prisma_js_1.default.taskUpdate.create({
            data: {
                taskId: id,
                userId: user.id,
                progress: currentProgress,
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'TASK_COMMENT_ADDED',
            description: `${user.name} added an update on "${task.title}": "${comment}"`,
        });
        (0, index_js_1.emitToAdmin)('task:comment_added', { task: updatedTask, update: taskUpdate });
        (0, index_js_1.emitToUser)(task.assignedTo, 'task:comment_added', { task: updatedTask, update: taskUpdate });
        res.status(201).json({
            message: 'Update posted successfully',
            task: updatedTask,
            update: taskUpdate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addTaskComment = addTaskComment;
const getCompletedTasksReport = async (req, res, next) => {
    try {
        const { assignedTo, priority, category, search, page = '1', limit = '15', date } = req.query;
        const user = req.user;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 15;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            status: 'COMPLETED',
        };
        if (user.role !== 'ADMIN') {
            where.assignedTo = user.id;
        }
        else if (assignedTo && typeof assignedTo === 'string') {
            where.assignedTo = assignedTo;
        }
        if (priority && typeof priority === 'string') {
            where.priority = priority;
        }
        if (category && typeof category === 'string') {
            where.category = category;
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }
        const [total, tasks] = await Promise.all([
            prisma_js_1.default.task.count({ where }),
            prisma_js_1.default.task.findMany({
                where,
                include: {
                    assignedUser: {
                        select: { id: true, name: true, email: true, status: true },
                    },
                    creator: {
                        select: { id: true, name: true, email: true },
                    },
                    updates: {
                        orderBy: { createdAt: 'desc' },
                        take: 2,
                        include: {
                            user: {
                                select: { id: true, name: true, role: true },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limitNum,
            }),
        ]);
        const formattedTasks = tasks.map((t) => {
            const completedDate = new Date(t.updatedAt);
            const startDate = new Date(t.startDate);
            const turnaroundDays = Math.max(1, Math.round((completedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            const completedOnTime = completedDate <= new Date(t.dueDate);
            return {
                ...t,
                completedAt: t.updatedAt,
                turnaroundDays,
                completedOnTime,
                latestNote: t.updates[0]?.comment || 'Milestone delivered',
            };
        });
        res.json({
            completedTasks: formattedTasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCompletedTasksReport = getCompletedTasksReport;
