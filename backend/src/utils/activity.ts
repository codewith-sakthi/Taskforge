import prisma from '../config/prisma.js';
import { emitToAdmin, emitToAll, emitToUser } from '../socket/index.js';

interface LogActivityParams {
  userId?: string | null;
  action: string;
  description: string;
}

export const logActivity = async ({ userId, action, description }: LogActivityParams) => {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        description,
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

    // Real-time broadcast
    emitToAll('activity:new', activity);

    return activity;
  } catch (error) {
    console.error('Failed to record activity log:', error);
  }
};

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
}

export const createNotification = async ({ userId, title, message }: CreateNotificationParams) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // Send real-time notification to the user
    emitToUser(userId, 'notification:new', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
