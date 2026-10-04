import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization Bearer header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check HTTP-only cookie
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User account not found.' });
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
};

export const requireMember = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || (req.user.role !== 'MEMBER' && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Access denied. Member privileges required.' });
    return;
  }
  next();
};
