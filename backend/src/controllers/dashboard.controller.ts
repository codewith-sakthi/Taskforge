import { Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { getTodayDateString } from '../utils/date.js';

export const getAdminDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStr = getTodayDateString();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Members count
    const [totalMembers, activeMembersCount, inactiveMembersCount] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'INACTIVE' } }),
    ]);

    // 2. Tasks stats
    const allTasks = await prisma.task.findMany({
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, status: true },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let pendingTasksCount = 0;
    let inProgressTasksCount = 0;
    let completedTasksCount = 0;
    let overdueTasksCount = 0;
    let completedTodayCount = 0;
    let completedThisWeekCount = 0;

    const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    const statusCounts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0 };
    const categoryCounts: Record<string, number> = {};

    const completedTasksList: any[] = [];

    allTasks.forEach((t) => {
      const isOverdue = t.status !== 'COMPLETED' && new Date(t.dueDate) < now;
      const effectiveStatus = isOverdue ? 'OVERDUE' : t.status;

      if (effectiveStatus === 'OVERDUE') {
        overdueTasksCount++;
        statusCounts.OVERDUE = (statusCounts.OVERDUE || 0) + 1;
      } else if (effectiveStatus === 'COMPLETED') {
        completedTasksCount++;
        statusCounts.COMPLETED = (statusCounts.COMPLETED || 0) + 1;

        const completedDate = new Date(t.updatedAt);
        if (completedDate >= todayStart) {
          completedTodayCount++;
        }
        if (completedDate >= weekStart) {
          completedThisWeekCount++;
        }

        const turnaroundDays = Math.max(
          1,
          Math.round((completedDate.getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24))
        );

        completedTasksList.push({
          id: t.id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          progress: t.progress,
          assignedUser: t.assignedUser,
          completedAt: t.updatedAt,
          turnaroundDays,
          lastComment: t.updates[0]?.comment || 'Task completed',
        });
      } else if (effectiveStatus === 'IN_PROGRESS') {
        inProgressTasksCount++;
        statusCounts.IN_PROGRESS = (statusCounts.IN_PROGRESS || 0) + 1;
      } else {
        pendingTasksCount++;
        statusCounts.PENDING = (statusCounts.PENDING || 0) + 1;
      }

      if (t.priority in priorityCounts) {
        priorityCounts[t.priority]++;
      }

      const cat = t.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const completionRate = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

    // 3. Weekly completion trend (last 7 days completed tasks)
    const weeklyTrendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = getTodayDateString(d);
      weeklyTrendMap[ds] = 0;
    }

    allTasks.forEach((t) => {
      if (t.status === 'COMPLETED') {
        const dStr = getTodayDateString(new Date(t.updatedAt));
        if (dStr in weeklyTrendMap) {
          weeklyTrendMap[dStr]++;
        }
      }
    });

    const weeklyTrends = Object.keys(weeklyTrendMap).map((dateKey) => {
      const d = new Date(dateKey);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        date: dateKey,
        day: dayName,
        completed: weeklyTrendMap[dateKey],
      };
    });

    // 4. Member task completion performance overview
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        tasksAssigned: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            priority: true,
            dueDate: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const memberOverview = members.map((m) => {
      const total = m.tasksAssigned.length;
      const completed = m.tasksAssigned.filter((t) => t.status === 'COMPLETED').length;
      const inProgress = m.tasksAssigned.filter((t) => t.status === 'IN_PROGRESS').length;
      const overdue = m.tasksAssigned.filter((t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < now).length;
      const memberRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const activeTask = m.tasksAssigned.find((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING') || null;
      const lastCompleted = m.tasksAssigned
        .filter((t) => t.status === 'COMPLETED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null;

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        memberStatus: m.status,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate: memberRate,
        currentTask: activeTask ? activeTask.title : null,
        currentTaskId: activeTask ? activeTask.id : null,
        taskProgress: activeTask ? activeTask.progress : (completed > 0 ? 100 : 0),
        lastCompletedTask: lastCompleted ? lastCompleted.title : null,
        lastCompletedAt: lastCompleted ? lastCompleted.updatedAt : null,
      };
    });

    // 5. Recent Activity Logs
    const recentActivities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json({
      stats: {
        totalMembers,
        activeMembers: activeMembersCount,
        inactiveMembers: inactiveMembersCount,
        totalTasks: allTasks.length,
        pendingTasks: pendingTasksCount,
        inProgressTasks: inProgressTasksCount,
        completedTasks: completedTasksCount,
        overdueTasks: overdueTasksCount,
        completionRate,
        completedToday: completedTodayCount,
        completedThisWeek: completedThisWeekCount,
      },
      charts: {
        statusDistribution: [
          { name: 'Completed', value: statusCounts.COMPLETED, color: '#16A34A' },
          { name: 'In Progress', value: statusCounts.IN_PROGRESS, color: '#2563EB' },
          { name: 'Pending', value: statusCounts.PENDING, color: '#F59E0B' },
          { name: 'Overdue', value: statusCounts.OVERDUE, color: '#DC2626' },
        ],
        priorityDistribution: [
          { name: 'Low', count: priorityCounts.LOW },
          { name: 'Medium', count: priorityCounts.MEDIUM },
          { name: 'High', count: priorityCounts.HIGH },
          { name: 'Urgent', count: priorityCounts.URGENT },
        ],
        weeklyTrends,
        categoryDistribution: Object.entries(categoryCounts).map(([cat, count]) => ({
          category: cat,
          count,
        })),
      },
      memberOverview,
      recentCompletedTasks: completedTasksList.slice(0, 8),
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Member's tasks
    const tasks = await prisma.task.findMany({
      where: { assignedTo: user.id },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let completedToday = 0;
    let completedThisWeek = 0;

    const formattedTasks = tasks.map((task) => {
      const isOverdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < now;
      const status = isOverdue && task.status !== 'COMPLETED' ? 'OVERDUE' : task.status;

      if (status === 'COMPLETED') {
        completedCount++;
        const completedDate = new Date(task.updatedAt);
        if (completedDate >= todayStart) completedToday++;
        if (completedDate >= weekStart) completedThisWeek++;
      } else if (status === 'OVERDUE') {
        overdueCount++;
      } else if (status === 'IN_PROGRESS') {
        inProgressCount++;
      } else {
        pendingCount++;
      }

      return {
        ...task,
        status,
        isOverdue,
      };
    });

    const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    // 2. Urgent / Active tasks (pending or in progress)
    const activeTasks = formattedTasks
      .filter((t) => t.status !== 'COMPLETED')
      .slice(0, 5);

    // 3. Recently completed deliverables
    const recentlyCompleted = formattedTasks
      .filter((t) => t.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
      .map((t) => {
        const turnaroundDays = Math.max(
          1,
          Math.round((new Date(t.updatedAt).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        return {
          id: t.id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          completedAt: t.updatedAt,
          turnaroundDays,
          lastComment: t.updates[0]?.comment || 'Completed milestone',
        };
      });

    // 4. Recent activity for this member
    const recentActivity = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // 5. Unread notifications count
    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    res.json({
      taskStats: {
        totalTasks: tasks.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        overdue: overdueCount,
        completionRate,
        completedToday,
        completedThisWeek,
      },
      activeTasks,
      recentlyCompleted,
      recentActivity,
      unreadNotificationsCount,
    });
  } catch (error) {
    next(error);
  }
};
