import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MemberDashboardData, Task } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Award,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const MemberDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchMemberDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/member');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch member dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberDashboard();

    const socket = getSocket();
    const handleUpdate = () => fetchMemberDashboard();

    socket.on('task:assigned', handleUpdate);
    socket.on('task:updated', handleUpdate);
    socket.on('task:progress_changed', handleUpdate);
    socket.on('task:status_changed', handleUpdate);

    return () => {
      socket.off('task:assigned', handleUpdate);
      socket.off('task:updated', handleUpdate);
      socket.off('task:progress_changed', handleUpdate);
      socket.off('task:status_changed', handleUpdate);
    };
  }, [fetchMemberDashboard]);

  const handleQuickComplete = async (taskId: string, title: string) => {
    setCompletingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/progress`, {
        progress: 100,
        comment: 'Marked completed from dashboard',
      });
      success(`Great job! "${title}" has been completed! 🎉`);
      fetchMemberDashboard();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { taskStats, activeTasks, recentlyCompleted } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hello, <span className="text-blue-600">{user?.name}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your personal task execution, completion tracker, and deliverables hub.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/member/tasks')}
          icon={<CheckSquare className="w-4 h-4" />}
        >
          View All My Tasks
        </Button>
      </div>

      {/* Task Completion Hero Command Center */}
      <Card className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border-0 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Milestone Progress</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {taskStats.completionRate}% Completion Rate
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mt-2">
              {taskStats.completed} of {taskStats.totalTasks} Tasks Delivered
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-md leading-relaxed">
              {taskStats.pending + taskStats.inProgress > 0
                ? `You have ${taskStats.inProgress} tasks underway and ${taskStats.pending} ready for kickoff.`
                : 'All your tasks are 100% completed! Fantastic productivity.'}
            </p>

            <div className="mt-4 max-w-md">
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${taskStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/member/completed-tasks')}
              icon={<Award className="w-4 h-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25"
            >
              Completed Deliverables ({taskStats.completed})
            </Button>
          </div>
        </div>
      </Card>

      {/* Task Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Completed Tasks"
          value={taskStats.completed}
          subtitle={`${taskStats.completedToday} finished today`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorScheme="emerald"
        />
        <StatCard
          title="In Progress"
          value={taskStats.inProgress}
          subtitle="Currently active tasks"
          icon={<Zap className="w-5 h-5" />}
          colorScheme="blue"
        />
        <StatCard
          title="Pending Kickoff"
          value={taskStats.pending}
          subtitle="Awaiting your start"
          icon={<Clock className="w-5 h-5" />}
          colorScheme="amber"
        />
        <StatCard
          title="Overdue Risk"
          value={taskStats.overdue}
          subtitle={taskStats.overdue > 0 ? 'Urgent attention required' : 'Deadlines in check'}
          icon={<AlertCircle className="w-5 h-5" />}
          colorScheme="rose"
        />
      </div>

      {/* Active Tasks & Recently Completed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks List with Quick Complete */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Tasks to Deliver"
              description="Tasks requiring progress milestones and completion"
              action={
                <button
                  onClick={() => navigate('/member/tasks')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  All Tasks <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="space-y-3.5">
              {activeTasks.length === 0 ? (
                <EmptyState
                  title="No pending tasks"
                  description="You have completed all assigned tasks! Check back when your manager delegates new tasks."
                  icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                />
              ) : (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {task.category}
                          </span>
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                        <h4
                          onClick={() => navigate(`/member/tasks/${task.id}`)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="success"
                          isLoading={completingTaskId === task.id}
                          onClick={() => handleQuickComplete(task.id, task.title)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="text-xs font-bold"
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                      <div className="w-48">
                        <ProgressBar progress={task.progress} showLabel size="sm" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => navigate(`/member/tasks/${task.id}`)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Celebratory Completed Deliverables Widget */}
        <div>
          <Card>
            <CardHeader
              title="Completed Milestones"
              description="Your finished deliverables & achievements"
              action={
                <button
                  onClick={() => navigate('/member/completed-tasks')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {recentlyCompleted.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No completed deliverables yet. Move tasks to 100% to celebrate milestones!
                </p>
              ) : (
                recentlyCompleted.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/member/tasks/${task.id}`)}
                    className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{task.title}</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        100%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                      "{task.lastComment}"
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Turnaround: {task.turnaroundDays}d</span>
                      <span>{formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
