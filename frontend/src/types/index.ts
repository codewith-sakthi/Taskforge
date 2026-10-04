export type UserRole = 'ADMIN' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface MemberListItem extends User {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  currentTask: string | null;
  currentTaskId: string | null;
  taskProgress: number;
  lastCompletedTask: string | null;
  lastCompletedAt: string | null;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  progress: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  createdBy: string;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    status?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  updates?: TaskUpdate[];
  _count?: {
    updates: number;
  };
}

export interface CompletedTaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  progress: number;
  completedAt: string;
  turnaroundDays: number;
  completedOnTime?: boolean;
  latestNote?: string;
  lastComment?: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  durationMinutes?: number | null;
  user?: {
    id: string;
    name: string;
    email: string;
    status?: string;
  };
}


export interface ActivityLog {

  id: string;
  userId: string | null;
  action: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboardData {
  stats: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    completedToday: number;
    completedThisWeek: number;
  };
  charts: {
    statusDistribution: { name: string; value: number; color: string }[];
    priorityDistribution: { name: string; count: number }[];
    weeklyTrends: { date: string; day: string; completed: number }[];
    categoryDistribution?: { category: string; count: number }[];
  };
  memberOverview: {
    id: string;
    name: string;
    email: string;
    memberStatus: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    currentTask: string | null;
    currentTaskId: string | null;
    taskProgress: number;
    lastCompletedTask: string | null;
    lastCompletedAt: string | null;
  }[];
  recentCompletedTasks: CompletedTaskItem[];
  recentActivities: ActivityLog[];
}

export interface MemberDashboardData {
  taskStats: {
    totalTasks: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
    completedToday: number;
    completedThisWeek: number;
  };
  activeTasks: Task[];
  recentlyCompleted: CompletedTaskItem[];
  recentActivity: ActivityLog[];
  unreadNotificationsCount: number;
}
