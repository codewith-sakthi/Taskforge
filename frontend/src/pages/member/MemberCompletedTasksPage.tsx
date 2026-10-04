import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { CompletedTaskItem } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PriorityBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  Calendar,
  Search,
  Award,
  Sparkles,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const MemberCompletedTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const [completedTasks, setCompletedTasks] = useState<CompletedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
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
        limit: 12,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
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
  }, [page, searchQuery, selectedPriority, selectedCategory, error]);

  useEffect(() => {
    fetchCompletedTasks();

    const socket = getSocket();
    const handleUpdate = () => fetchCompletedTasks();

    socket.on('task:status_changed', handleUpdate);
    socket.on('task:progress_changed', handleUpdate);

    return () => {
      socket.off('task:status_changed', handleUpdate);
      socket.off('task:progress_changed', handleUpdate);
    };
  }, [fetchCompletedTasks]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPriority('');
    setSelectedCategory('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Completed Tasks</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          A list of all assigned tasks and projects you have successfully completed.
        </p>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search your completed tasks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
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

            {(searchQuery || selectedPriority || selectedCategory) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="shrink-0 text-xs"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Completed Tasks Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : completedTasks.length === 0 ? (
        <EmptyState
          title="No completed tasks yet"
          description={
            searchQuery || selectedPriority
              ? 'No completed tasks match your search filter.'
              : 'As you finish tasks and reach 100% progress, your completed tasks will be shown here.'
          }
          icon={<Award className="w-8 h-8 text-emerald-500" />}
          actionLabel="Go to My Tasks"
          onAction={() => navigate('/member/tasks')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {completedTasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => navigate(`/member/tasks/${task.id}`)}
              className="p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer bg-white group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                    {task.category}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {task.title}
                </h3>

                {task.latestNote && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    "{task.latestNote}"
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Turnaround Time:</span>
                  <span className="font-bold text-slate-800">
                    {task.turnaroundDays} day{task.turnaroundDays === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <span>Completed On:</span>
                  <span className="font-semibold text-slate-700">
                    {format(new Date(task.completedAt), 'MMM dd, yyyy')}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 text-xs group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/member/tasks/${task.id}`);
                  }}
                  icon={<Eye className="w-3.5 h-3.5" />}
                >
                  View Task Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
