"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTaskCommentSchema = exports.updateTaskStatusSchema = exports.updateTaskProgressSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title is required'),
    description: zod_1.z.string().min(2, 'Description is required'),
    assignedTo: zod_1.z.string().uuid('Valid assigned member is required').or(zod_1.z.string().min(1, 'Assigned member is required')),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    category: zod_1.z.string().min(1, 'Category is required').default('General'),
    startDate: zod_1.z.string().or(zod_1.z.date()),
    dueDate: zod_1.z.string().or(zod_1.z.date()),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().min(2).optional(),
    assignedTo: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
    progress: zod_1.z.number().min(0).max(100).optional(),
    startDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    dueDate: zod_1.z.string().or(zod_1.z.date()).optional(),
});
exports.updateTaskProgressSchema = zod_1.z.object({
    progress: zod_1.z.number().min(0).max(100),
    comment: zod_1.z.string().optional(),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
    comment: zod_1.z.string().optional(),
});
exports.addTaskCommentSchema = zod_1.z.object({
    comment: zod_1.z.string().min(1, 'Comment cannot be empty'),
    progress: zod_1.z.number().min(0).max(100).optional(),
});
