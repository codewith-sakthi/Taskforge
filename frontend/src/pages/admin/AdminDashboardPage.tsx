import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { AdminDashboardData } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader } from '../../components/common/Card';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Users,
  CheckCircle2,
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Award,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await api.get('/dashboard/admin');
      setData(res.data);
    } catch (error) {
      console.error('Failed to load admin dashboard stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    const handleRealtimeUpdate = () => {
      fetchDashboardData();
    };

    socket.on('task:created', handleRealtimeUpdate);
    socket.on('task:updated', handleRealtimeUpdate);
    socket.on('task:progress_changed', handleRealtimeUpdate);
    socket.on('task:status_changed', handleRealtimeUpdate);
    socket.on('member:created', handleRealtimeUpdate);
    socket.on('member:status_changed', handleRealtimeUpdate);
    socket.on('activity:new', handleRealtimeUpdate);

    return () => {
      socket.off('task:created', handleRealtimeUpdate);
      socket.off('task:updated', handleRealtimeUpdate);
      socket.off('task:progress_changed', handleRealtimeUpdate);
      socket.off('task:status_changed', handleRealtimeUpdate);
      socket.off('member:created', handleRealtimeUpdate);
      socket.off('member:status_changed', handleRealtimeUpdate);
      socket.off('activity:new', handleRealtimeUpdate);
    };
  }, [fetchDashboardData]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { stats, charts, memberOverview, recentCompletedTasks, recentActivities } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Admin Overview & Task Pulse</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking on assigned tasks, team progress, and completed tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            isLoading={isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="flex-1 sm:flex-none"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/tasks')}
            icon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          subtitle={`${stats.completionRate}% completion rate (${stats.totalTasks} total)`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorScheme="emerald"
        />
        <StatCard
          title="Tasks In Progress"
          value={stats.inProgressTasks}
          subtitle={`${stats.pendingTasks} pending kickoff`}
          icon={<CheckSquare className="w-5 h-5" />}
          colorScheme="blue"
        />
        <StatCard
          title="Completed This Week"
          value={stats.completedThisWeek}
          subtitle={`${stats.completedToday} closed today`}
          icon={<Award className="w-5 h-5" />}
          colorScheme="purple"
        />
        <StatCard
          title="Overdue Risk"
          value={stats.overdueTasks}
          subtitle={stats.overdueTasks > 0 ? 'Requires attention' : 'All tasks on schedule'}
          icon={<AlertCircle className="w-5 h-5" />}
          colorScheme="rose"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Task Completion Velocity Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Task Completion Trend (Past 7 Days)"
            description="Number of completed tasks per day across the team"
            action={
              <button
                onClick={() => navigate('/admin/completed-tasks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Completed Tasks <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} Tasks Completed`, 'Velocity']}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#16A34A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#compGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Status Donut Distribution */}
        <Card>
          <CardHeader
            title="Task Status Distribution"
            description="Overall workload breakdown"
          />
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
            {charts.statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Member Task Completion Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Team Members Completion Matrix"
            description="Assigned workload, completion percentage, and active tasks per team member"
            action={
              <button
                onClick={() => navigate('/admin/members')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                All Members <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">Completed / Total</th>
                  <th className="py-3.5 px-4">Completion Rate</th>
                  <th className="py-3.5 px-4">Active Task</th>
                  <th className="py-3.5 px-5 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberOverview.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No team members found
                    </td>
                  </tr>
                ) : (
                  memberOverview.map((member) => (
                    <tr
                      key={member.id}
                      onClick={() => navigate(`/admin/members/${member.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600">{member.completedTasks}</span>
                        <span className="text-slate-400"> / {member.totalTasks} tasks</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-28">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{member.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${member.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {member.currentTask ? (
                          <span className="font-semibold text-slate-800 truncate block max-w-[180px]">
                            {member.currentTask}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No pending tasks</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {member.currentTask ? (
                          <div className="w-24 ml-auto">
                            <ProgressBar progress={member.taskProgress} showLabel size="sm" />
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold">100%</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Completed Deliverables Showcase */}
        <Card>
          <CardHeader
            title="Recently Completed"
            description="Latest milestones closed by staff"
            action={
              <button
                onClick={() => navigate('/admin/completed-tasks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                All Completed <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {recentCompletedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tasks completed yet.
              </div>
            ) : (
              recentCompletedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/admin/tasks/${task.id}`)}
                  className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{task.title}</h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Completed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{task.lastComment}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700">{task.assignedUser?.name}</span>
                    <span>{formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
