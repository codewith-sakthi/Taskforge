import { Request } from 'express';

export type UserRole = 'ADMIN' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type CheckInStatus = 'ACTIVE' | 'COMPLETED';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
