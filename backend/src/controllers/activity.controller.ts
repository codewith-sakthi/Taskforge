import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';

export const getActivityLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, action, search, page = '1', limit = '20' } = req.query;
    const user = req.user!;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Non-admin can only see their own activities
    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    } else if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (action && typeof action === 'string') {
      where.action = action;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { description: { contains: search } },
        { action: { contains: search } },
      ];
    }

    const [total, activities] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
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
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
