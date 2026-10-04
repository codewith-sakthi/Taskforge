import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Task } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CheckSquare,
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const MemberTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params: any = {};
      if (activeTab !== 'all') {
        params.filter = activeTab;
      }

      const res = await api.get('/tasks/my', { params });
      setTasks(res.data.tasks || []);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load assigned tasks');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, error]);

  useEffect(() => {
    fetchTasks();

    const socket = getSocket();
    const handleTaskChange = () => fetchTasks();

    socket.on('task:assigned', handleTaskChange);
    socket.on('task:updated', handleTaskChange);
    socket.on('task:progress_changed', handleTaskChange);
    socket.on('task:status_changed', handleTaskChange);

    return () => {
      socket.off('task:assigned', handleTaskChange);
      socket.off('task:updated', handleTaskChange);
      socket.off('task:progress_changed', handleTaskChange);
      socket.off('task:status_changed', handleTaskChange);
    };
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review assignments, update task milestones, and collaborate with your team.
        </p>
      </div>

      {/* Tabs & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
            {[
              { key: 'all', label: 'All Tasks' },
              { key: 'today', label: "Today's Tasks" },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'overdue', label: 'Overdue' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in my tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks in this view"
          description={
            searchQuery
              ? 'No assigned tasks match your search filter.'
              : `You have no ${activeTab === 'all' ? '' : activeTab} tasks scheduled.`
          }
          icon={<CheckSquare className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => navigate(`/member/tasks/${task.id}`)}
              className="flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group p-5 cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-slate-100">
                    {task.category || 'General'}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Progress & Due Date */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <ProgressBar progress={task.progress} showLabel size="sm" />

                <div className="flex items-center justify-between text-xs">
                  <StatusBadge status={task.status} />
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 text-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/member/tasks/${task.id}`);
                  }}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Details & Update
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
