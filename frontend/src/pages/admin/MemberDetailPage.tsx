import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  ExternalLink,
  Award,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [member, setMember] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/members/${id}`);
        setMember(res.data.member);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load member profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, error]);

  if (isLoading || !member) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const completedTasks = member.tasksAssigned.filter((t: any) => t.status === 'COMPLETED');
  const activeTasks = member.tasksAssigned.filter((t: any) => t.status !== 'COMPLETED');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/members')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Team Members
      </button>

      {/* Profile Overview Card */}
      <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-0 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{member.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {member.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {member.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/80 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-300" />
                  {member.email}
                </span>
                {member.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-300" />
                    {member.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Completion Velocity</p>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {member.completionRate}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{member.totalTasks}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{member.inProgressTasks}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{member.completedTasks}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{member.completionRate}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active & Pending Tasks */}
        <Card>
          <CardHeader
            title="In-Flight & Active Tasks"
            description="Workload currently underway"
          />
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {activeTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active tasks in progress.</p>
            ) : (
              activeTasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/admin/tasks/${task.id}`)}
                  className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <StatusBadge status={task.status} />
                    <div className="w-32">
                      <ProgressBar progress={task.progress} showLabel size="sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Completed Tasks Archive */}
        <Card>
          <CardHeader
            title="Completed Tasks Archive"
            description="Historical log of finished tasks and milestones"
          />
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {completedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No completed tasks yet.</p>
            ) : (
              completedTasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/admin/tasks/${task.id}`)}
                  className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      100% Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="font-medium text-slate-700">Category: {task.category}</span>
                    <span>Completed {format(new Date(task.updatedAt), 'MMM dd, yyyy')}</span>
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
