import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ActivityLog } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Activity,
  Search,
  Filter,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActivityPage: React.FC = () => {
  const { error } = useToast();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = useCallback(async () => {
    try {
      const params: any = {
        page,
        limit: 20,
      };
      if (actionFilter) params.action = actionFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/activity', { params });
      setActivities(res.data.activities || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, searchQuery, error]);

  useEffect(() => {
    fetchActivities();

    const socket = getSocket();
    const handleNewActivity = (activity: ActivityLog) => {
      setActivities((prev) => [activity, ...prev.slice(0, 19)]);
      setTotalCount((prev) => prev + 1);
    };

    socket.on('activity:new', handleNewActivity);
    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [fetchActivities]);

  const getActionBadge = (action: string) => {
    if (action.includes('MEMBER_CREATED') || action.includes('ACTIVATED')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">MEMBER</span>;
    }
    if (action.includes('CHECKED_IN') || action.includes('CHECKED_OUT')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CHECK-IN</span>;
    }
    if (action.includes('TASK')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">TASK</span>;
    }
    if (action.includes('DEACTIVATED') || action.includes('SECURITY')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">SECURITY</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit & Activity Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable chronicle of team logins, task status progressions, and check-in events.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by description keyword..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">All Action Types</option>
              <option value="MEMBER_CREATED">Member Created</option>
              <option value="MEMBER_CHECKED_IN">Member Checked In</option>
              <option value="MEMBER_CHECKED_OUT">Member Checked Out</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_PROGRESS_CHANGED">Task Progress Changed</option>
              <option value="TASK_COMPLETED">Task Completed</option>
              <option value="LOGIN">Member Login</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Activity Timeline List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={4} />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No activity recorded"
              description="Platform actions and event logs will be captured here in real-time."
              icon={<Activity className="w-8 h-8" />}
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">User / Actor</th>
                    <th className="py-3.5 px-4">Event Category</th>
                    <th className="py-3.5 px-4">Activity Description</th>
                    <th className="py-3.5 px-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        {item.user ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {item.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{item.user.name}</div>
                              <div className="text-[10px] text-slate-400">{item.user.role}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System Automation</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {getActionBadge(item.action)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {item.description}
                      </td>

                      <td className="py-3.5 px-6 text-right text-slate-500 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 block">
                          {new Date(item.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">{activities.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> logs
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="font-semibold text-slate-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
