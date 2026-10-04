import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { getTodayDateString } from '../utils/date.js';
import { logActivity, createNotification } from '../utils/activity.js';
import { emitToAdmin, emitToUser } from '../socket/index.js';

export const checkIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const todayStr = getTodayDateString();
    const now = new Date();

    // Check if there is already a check-in for today
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: user.id,
        date: todayStr,
      },
    });

    if (existingCheckIn) {
      if (existingCheckIn.status === 'ACTIVE' && !existingCheckIn.checkOutTime) {
        res.status(400).json({ message: 'You are already checked in for today.' });
        return;
      }
      if (existingCheckIn.status === 'COMPLETED' || existingCheckIn.checkOutTime) {
        res.status(400).json({ message: 'You have already completed your check-in and check-out for today.' });
        return;
      }
    }

    const checkInRecord = await prisma.checkIn.create({
      data: {
        userId: user.id,
        date: todayStr,
        checkInTime: now,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'MEMBER_CHECKED_IN',
      description: `${user.name} checked in for work today at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
    });

    emitToAdmin('checkin:new', checkInRecord);
    emitToUser(user.id, 'checkin:status_changed', checkInRecord);

    res.status(201).json({
      message: 'Checked in successfully',
      checkIn: checkInRecord,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const todayStr = getTodayDateString();
    const now = new Date();

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: user.id,
        date: todayStr,
      },
    });

    if (!existingCheckIn) {
      res.status(400).json({ message: 'You cannot check out before checking in for today.' });
      return;
    }

    if (existingCheckIn.checkOutTime || existingCheckIn.status === 'COMPLETED') {
      res.status(400).json({ message: 'You have already checked out for today.' });
      return;
    }

    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: existingCheckIn.id },
      data: {
        checkOutTime: now,
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'MEMBER_CHECKED_OUT',
      description: `${user.name} checked out at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
    });

    emitToAdmin('checkout:new', updatedCheckIn);
    emitToUser(user.id, 'checkin:status_changed', updatedCheckIn);

    res.json({
      message: 'Checked out successfully',
      checkIn: updatedCheckIn,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTodayCheckIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const todayStr = getTodayDateString();

    const todayCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: user.id,
        date: todayStr,
      },
    });

    // Recent 10 checkins for user
    const history = await prisma.checkIn.findMany({
      where: { userId: user.id },
      orderBy: { checkInTime: 'desc' },
      take: 10,
    });

    let currentStatus = 'NOT CHECKED IN';
    if (todayCheckIn) {
      currentStatus = todayCheckIn.checkOutTime ? 'COMPLETED' : 'ACTIVE';
    }

    res.json({
      todayCheckIn,
      currentStatus,
      history,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCheckIns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, userId, status, page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (date && typeof date === 'string') {
      where.date = date;
    }

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      where.user = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      };
    }

    const [total, checkIns] = await Promise.all([
      prisma.checkIn.count({ where }),
      prisma.checkIn.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
        orderBy: { checkInTime: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    // Calculate duration for each record
    const formattedCheckIns = checkIns.map((ci) => {
      let durationMinutes = null;
      if (ci.checkInTime && ci.checkOutTime) {
        const diffMs = new Date(ci.checkOutTime).getTime() - new Date(ci.checkInTime).getTime();
        durationMinutes = Math.round(diffMs / (1000 * 60));
      }

      return {
        ...ci,
        durationMinutes,
      };
    });

    res.json({
      checkIns: formattedCheckIns,
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
