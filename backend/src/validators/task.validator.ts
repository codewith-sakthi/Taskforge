import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(2, 'Description is required'),
  assignedTo: z.string().uuid('Valid assigned member is required').or(z.string().min(1, 'Assigned member is required')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.string().min(1, 'Category is required').default('General'),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
});

export const updateTaskProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  comment: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
  comment: z.string().optional(),
});

export const addTaskCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty'),
  progress: z.number().min(0).max(100).optional(),
});
