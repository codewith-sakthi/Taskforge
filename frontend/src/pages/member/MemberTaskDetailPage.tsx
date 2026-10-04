import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Task } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MemberTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Update form states
  const [progressVal, setProgressVal] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
      setProgressVal(res.data.task.progress);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchTaskDetails();

    const socket = getSocket();
    const handleTaskEvent = (data: any) => {
      if (data.task?.id === id || data.id === id) {
        fetchTaskDetails();
      }
    };

    socket.on('task:updated', handleTaskEvent);
    socket.on('task:progress_changed', handleTaskEvent);
    socket.on('task:status_changed', handleTaskEvent);
    socket.on('task:comment_added', handleTaskEvent);

    return () => {
      socket.off('task:updated', handleTaskEvent);
      socket.off('task:progress_changed', handleTaskEvent);
      socket.off('task:status_changed', handleTaskEvent);
      socket.off('task:comment_added', handleTaskEvent);
    };
  }, [fetchTaskDetails, id]);

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/tasks/${id}/progress`, {
        progress: progressVal,
        comment: commentText.trim() || undefined,
      });

      if (progressVal === 100) {
        success('Awesome work! Task marked as 100% Completed.');
      } else {
        success(`Progress updated to ${progressVal}%`);
      }
      setCommentText('');
      fetchTaskDetails();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetProgress = (val: number) => {
    setProgressVal(val);
  };

  if (isLoading || !task) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={() => navigate('/member/tasks')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Tasks
      </button>

      {/* Task Overview Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 uppercase tracking-wider">
                {task.category}
              </span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isOverdue && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>

            {/* Timeline Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Schedule Period</span>
                <span className="font-semibold text-slate-800">
                  {new Date(task.startDate).toLocaleDateString()} → {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned By</span>
                <span className="font-semibold text-slate-800">{task.creator?.name || 'Administrator'}</span>
              </div>
            </div>
          </div>

          {/* Current Progress Display */}
          <div className="w-full lg:w-72 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl shrink-0">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Progress</span>
              <span className="text-2xl font-black text-slate-900">{task.progress}%</span>
            </div>
            <ProgressBar progress={task.progress} size="lg" />
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              {task.progress === 100 ? 'Completed 🎉' : `${100 - task.progress}% remaining`}
            </p>
          </div>
        </div>
      </Card>

      {/* Interactive Progress & Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline updates list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Progress Updates & Timeline"
              description="Chronological log of milestones and comments"
            />

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {!task.updates || task.updates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No updates recorded yet.</p>
              ) : (
                task.updates.map((update) => (
                  <div key={update.id} className="relative pl-6 pb-4 border-l-2 border-blue-200 last:border-transparent">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{update.user?.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-1">{update.comment}</p>
                      {update.progress !== undefined && (
                        <div className="text-[11px] font-semibold text-blue-600 pt-1">
                          Progress milestone: {update.progress}%
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Progress Controller Widget */}
        <div>
          <Card className="sticky top-20">
            <CardHeader
              title="Update Progress"
              description="Adjust percentage and describe what was completed"
            />

            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Progress: <span className="text-blue-600">{progressVal}%</span>
                  </label>
                  {progressVal === 100 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Marks as Completed
                    </span>
                  )}
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={progressVal}
                  onChange={(e) => setProgressVal(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />

                {/* Quick step preset pills */}
                <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setPresetProgress(step)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        progressVal === step
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {step}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Progress Note / Comment
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="e.g. Worked on layout and updated components..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Update
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
