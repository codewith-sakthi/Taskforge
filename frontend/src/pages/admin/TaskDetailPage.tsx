import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Task, MemberListItem } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Send,
  MessageSquare,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add comment / update form
  const [newComment, setNewComment] = useState('');
  const [newProgress, setNewProgress] = useState<number>(0);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Edit Task Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM',
    category: '',
    status: 'PENDING',
    startDate: '',
    dueDate: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
      setNewProgress(res.data.task.progress);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  useEffect(() => {
    fetchTaskDetails();
    fetchMembers();

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
  }, [fetchTaskDetails, fetchMembers, id]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      error('Please write a comment or update description');
      return;
    }

    setIsSubmittingUpdate(true);
    try {
      await api.post(`/tasks/${id}/comments`, {
        comment: newComment.trim(),
        progress: newProgress,
      });
      success('Progress update recorded!');
      setNewComment('');
      fetchTaskDetails();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to post update');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const openEditModal = () => {
    if (!task) return;
    setEditFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      category: task.category,
      status: task.status,
      startDate: format(new Date(task.startDate), 'yyyy-MM-dd'),
      dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
    });
    setIsEditModalOpen(true);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEdit(true);
    try {
      await api.put(`/tasks/${id}`, editFormData);
      success('Task updated successfully');
      setIsEditModalOpen(false);
      fetchTaskDetails();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmittingEdit(false);
    }
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
      {/* Top back button & actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/tasks')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={openEditModal}
          icon={<Edit2 className="w-3.5 h-3.5" />}
        >
          Edit Task
        </Button>
      </div>

      {/* Main Task Header Card */}
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

            {/* Assignee & Dates Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {task.assignedUser?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Member</span>
                  <span className="font-bold text-slate-900">{task.assignedUser?.name}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Timeline</span>
                <span className="font-semibold text-slate-800">
                  {new Date(task.startDate).toLocaleDateString()} → {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
                <span className="font-semibold text-slate-800">{task.creator?.name || 'Administrator'}</span>
              </div>
            </div>
          </div>

          {/* Progress Box */}
          <div className="w-full lg:w-72 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl shrink-0">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Progress</span>
              <span className="text-2xl font-black text-slate-900">{task.progress}%</span>
            </div>
            <ProgressBar progress={task.progress} size="lg" />
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              {task.progress === 100 ? 'Task is 100% complete' : `${100 - task.progress}% remaining`}
            </p>
          </div>
        </div>
      </Card>

      {/* Updates Timeline & Add Comment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Updates */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Progress Updates & Timeline"
              description="Historical log of progress entries, comments, and milestones"
            />

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {!task.updates || task.updates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No updates logged yet.</p>
              ) : (
                task.updates.map((update, idx) => (
                  <div key={update.id} className="relative pl-6 pb-4 border-l-2 border-blue-200 last:border-transparent">
                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{update.user?.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold">
                            {update.user?.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pt-1">{update.comment}</p>
                      {update.progress !== undefined && (
                        <div className="text-[11px] font-semibold text-blue-600 pt-1">
                          Progress at {update.progress}%
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Add Update Box */}
        <div>
          <Card className="sticky top-20">
            <CardHeader
              title="Post Progress Update"
              description="Record a comment or milestone update"
            />

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adjust Progress: <span className="text-blue-600">{newProgress}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Comment / Status Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="e.g. Completed API integration and tested with postman..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmittingUpdate}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Post Update
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task Details"
        description="Update task scope, assignment, priority, or dates."
        maxWidth="xl"
      >
        <form onSubmit={handleEditTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reassign Member
              </label>
              <select
                value={editFormData.assignedTo}
                onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={editFormData.priority}
                onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={editFormData.startDate}
                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={editFormData.dueDate}
                onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
