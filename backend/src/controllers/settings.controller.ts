import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { logActivity } from '../utils/activity.js';

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      teamName: 'TeamPulse Core Team',
      checkInThresholdHours: '8',
      emailNotifications: 'true',
      timezone: 'Asia/Kolkata',
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({ settings: settingsMap });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { teamName, checkInThresholdHours, emailNotifications, timezone } = req.body;
    const entries = Object.entries({ teamName, checkInThresholdHours, emailNotifications, timezone });

    for (const [key, value] of entries) {
      if (value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    await logActivity({
      userId: req.user?.id,
      action: 'SETTINGS_UPDATED',
      description: `Admin updated organization system settings`,
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};
