import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { CheckIn } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  CheckCircle2,
  Timer,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const MemberCheckInPage: React.FC = () => {
  const { success, error } = useToast();

  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('NOT CHECKED IN');
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCheckInData = useCallback(async () => {
    try {
      const res = await api.get('/checkins/my');
      setTodayCheckIn(res.data.todayCheckIn);
      setCurrentStatus(res.data.currentStatus);
      setHistory(res.data.history || []);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load check-in data');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchCheckInData();

    const socket = getSocket();
    const handleStatusChange = () => fetchCheckInData();

    socket.on('checkin:status_changed', handleStatusChange);
    return () => {
      socket.off('checkin:status_changed', handleStatusChange);
    };
  }, [fetchCheckInData]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/checkins/check-in');
      success(res.data.message || 'Checked in successfully!');
      fetchCheckInData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/checkins/check-out');
      success(res.data.message || 'Checked out successfully!');
      fetchCheckInData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckedIn = todayCheckIn && todayCheckIn.status === 'ACTIVE' && !todayCheckIn.checkOutTime;
  const isCheckedOut = todayCheckIn && (todayCheckIn.status === 'COMPLETED' || !!todayCheckIn.checkOutTime);

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Check-In Station</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Record your daily work attendance and review your authenticated session history.
        </p>
      </div>

      {/* Hero Attendance Terminal Card */}
      <Card className="p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-0 shadow-2xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 z-10 relative">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-blue-200 mb-3">
              <Timer className="w-3.5 h-3.5 text-blue-400" />
              Real-Time Attendance Clock
            </div>

            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-sm font-medium text-blue-200/80 mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Status Indicator */}
            <div className="mt-6 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Today's Status:
              </div>
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Action Button Panel */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col items-center min-w-[280px]">
            {!todayCheckIn && (
              <div className="text-center space-y-4 w-full">
                <p className="text-xs text-blue-200">Ready to start your work shift?</p>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={handleCheckIn}
                  isLoading={isSubmitting}
                  icon={<LogIn className="w-5 h-5" />}
                  className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 font-bold shadow-xl shadow-blue-500/30 text-white"
                >
                  CHECK IN NOW
                </Button>
              </div>
            )}

            {isCheckedIn && (
              <div className="text-center space-y-4 w-full">
                <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-200 text-xs">
                  Checked in at{' '}
                  <span className="font-bold text-white font-mono">
                    {new Date(todayCheckIn.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <Button
                  size="lg"
                  variant="danger"
                  onClick={handleCheckOut}
                  isLoading={isSubmitting}
                  icon={<LogOut className="w-5 h-5" />}
                  className="w-full py-3.5 font-bold shadow-xl shadow-rose-500/30"
                >
                  CHECK OUT
                </Button>
              </div>
            )}

            {isCheckedOut && (
              <div className="text-center space-y-3 w-full py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-white">Shift Completed</h4>
                <p className="text-xs text-emerald-200/80">
                  In: {new Date(todayCheckIn.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}{' '}
                  • Out: {new Date(todayCheckIn.checkOutTime!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Attendance History Table */}
      <Card>
        <CardHeader
          title="Recent Attendance History"
          description="Your logged check-in and check-out timestamps"
        />

        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No past check-ins recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.date}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.checkOutTime
                        ? new Date(item.checkOutTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
