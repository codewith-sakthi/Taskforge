import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { ActivityLog } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MemberActivityPage: React.FC = () => {
  const { error } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await api.get('/activity', { params: { limit: 30 } });
      setActivities(res.data.activities || []);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch activity history');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchActivities();

    const socket = getSocket();
    const handleNewAct = (act: ActivityLog) => {
      setActivities((prev) => [act, ...prev]);
    };
    socket.on('activity:new', handleNewAct);

    return () => {
      socket.off('activity:new', handleNewAct);
    };
  }, [fetchActivities]);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Activity History</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review your logged attendance events, task milestones, and system updates.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Timeline Log"
          description="Chronological stream of your actions on TeamPulse"
        />

        {isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activity recorded yet"
            description="Your check-in stamps and task updates will be logged here."
            icon={<Activity className="w-8 h-8" />}
          />
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{act.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(act.createdAt).toLocaleString()}</span>
                    <span>({formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
