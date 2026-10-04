import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardHeader } from '../../components/common/Card';
import { Skeleton } from '../../components/common/Skeleton';
import { AdminDashboardData } from '../../types';
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
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Award, Zap } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { stats, charts } = data;

  const PRIORITY_COLORS: Record<string, string> = {
    Low: '#94a3b8',
    Medium: '#3b82f6',
    High: '#f59e0b',
    Urgent: '#dc2626',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Delivery Analytics & Throughput</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Comprehensive milestone metrics, task completion velocity, and workload distribution.
        </p>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completion Rate</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {stats.completionRate}%
          </p>
          <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
            {stats.completedTasks} of {stats.totalTasks} tasks closed
          </span>
        </Card>

        <Card className="p-4 bg-purple-50/50 border-purple-200">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Completed This Week</p>
          <p className="text-2xl font-black text-purple-950 mt-1">
            {stats.completedThisWeek}
          </p>
          <span className="text-[11px] text-purple-600 mt-0.5 block font-medium">
            {stats.completedToday} closed today
          </span>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">In-Flight Tasks</p>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {stats.inProgressTasks + stats.pendingTasks}
          </p>
          <span className="text-[11px] text-blue-600 mt-0.5 block font-medium">
            {stats.inProgressTasks} active in progress
          </span>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200">
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Risk</p>
          <p className="text-2xl font-black text-rose-950 mt-1">
            {stats.overdueTasks}
          </p>
          <span className="text-[11px] text-rose-600 mt-0.5 block font-medium">
            {stats.overdueTasks > 0 ? 'Requires immediate action' : 'All milestones on schedule'}
          </span>
        </Card>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Task Completion Velocity Area Chart */}
        <Card>
          <CardHeader
            title="Weekly Completion Velocity"
            description="Number of closed tasks per day"
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} Tasks Completed`, 'Velocity']}
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

        {/* Task Priority Bar Chart */}
        <Card>
          <CardHeader
            title="Tasks by Priority Level"
            description="Workload distribution by urgency"
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {charts.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
