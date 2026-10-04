import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { CompletedTaskItem, MemberListItem } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Award,
  Sparkles,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const CompletedTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const [completedTasks, setCompletedTasks] = useState<CompletedTaskItem[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompletedTasks = useCallback(async () => {
    try {
      const params: any = {
        page,
        limit: 15,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedMember) params.assignedTo = selectedMember;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/tasks/completed/report', { params });
      setCompletedTasks(res.data.completedTasks || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load completed tasks');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, selectedMember, selectedPriority, selectedCategory, error]);

  const fetchMembersList = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  useEffect(() => {
    fetchCompletedTasks();
    fetchMembersList();

    const socket = getSocket();
    const handleUpdate = () => fetchCompletedTasks();

    socket.on('task:status_changed', handleUpdate);
    socket.on('task:progress_changed', handleUpdate);

    return () => {
      socket.off('task:status_changed', handleUpdate);
      socket.off('task:progress_changed', handleUpdate);
    };
  }, [fetchCompletedTasks, fetchMembersList]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMember('');
    setSelectedPriority('');
    setSelectedCategory('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Completed Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit completed tasks, turnaround metrics, and completion notes across your team.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search completed tasks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={selectedMember}
              onChange={(e) => {
                setSelectedMember(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">All Team Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            {(searchQuery || selectedMember || selectedPriority || selectedCategory) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full text-xs text-slate-600"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Completed Tasks Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : completedTasks.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No completed tasks found"
              description="When team members finish their tasks (100% progress), they will appear here with completion notes."
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Completed Task</th>
                    <th className="py-3.5 px-4">Completed By</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Turnaround</th>
                    <th className="py-3.5 px-4">Completion Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                              {task.category}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                          </div>
                          {task.latestNote && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              "{task.latestNote}"
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {task.assignedUser?.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{task.assignedUser?.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {task.turnaroundDays} day{task.turnaroundDays === 1 ? '' : 's'}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {format(new Date(task.completedAt), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => navigate(`/admin/tasks/${task.id}`)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">{completedTasks.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> completed tasks
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
