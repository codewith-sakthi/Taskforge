import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { CheckIn, MemberListItem } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
} from 'lucide-react';

export const CheckInsPage: React.FC = () => {
  const { error } = useToast();

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCheckIns = useCallback(async () => {
    try {
      const params: any = {
        page,
        limit: 15,
      };
      if (selectedDate) params.date = selectedDate;
      if (selectedMember) params.userId = selectedMember;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/checkins', { params });
      setCheckIns(res.data.checkIns || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch check-in logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedDate, selectedMember, selectedStatus, searchQuery, error]);

  const fetchMembersList = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  useEffect(() => {
    fetchCheckIns();
    fetchMembersList();

    const socket = getSocket();
    const handleCheckInEvent = () => fetchCheckIns();
    socket.on('checkin:new', handleCheckInEvent);
    socket.on('checkout:new', handleCheckInEvent);

    return () => {
      socket.off('checkin:new', handleCheckInEvent);
      socket.off('checkout:new', handleCheckInEvent);
    };
  }, [fetchCheckIns, fetchMembersList]);

  const resetFilters = () => {
    setSelectedDate('');
    setSelectedMember('');
    setSelectedStatus('');
    setSearchQuery('');
    setPage(1);
  };

  const formatDuration = (mins?: number | null) => {
    if (mins === null || mins === undefined) return '-';
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hours === 0) return `${remainder} mins`;
    return `${hours}h ${remainder}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Check-In Monitoring</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit daily employee arrival times, sign-out stamps, and verified working duration.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3">
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
              placeholder="Search by member name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
            />
          </div>

          {/* Member Select */}
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

          {/* Status Select */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active (In)</option>
              <option value="COMPLETED">Completed (Out)</option>
            </select>

            {(selectedDate || selectedMember || selectedStatus || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="shrink-0 text-xs text-slate-500 hover:text-slate-900"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* CheckIns Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : checkIns.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No check-in records found"
              description="No employee attendance records match the selected date or filter query."
              icon={<Clock className="w-8 h-8" />}
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Team Member</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Check-In Time</th>
                    <th className="py-3.5 px-4">Check-Out Time</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkIns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.user?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.user?.name}</div>
                            <div className="text-[11px] text-slate-500">{item.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {item.date}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {new Date(item.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.checkOutTime ? (
                          new Date(item.checkOutTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })
                        ) : (
                          <span className="text-slate-400 italic">Not checked out</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatDuration(item.durationMinutes)}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">{checkIns.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> records
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
