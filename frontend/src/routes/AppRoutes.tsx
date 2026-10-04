import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { MemberLayout } from '../layouts/MemberLayout';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { MembersPage } from '../pages/admin/MembersPage';
import { MemberDetailPage } from '../pages/admin/MemberDetailPage';
import { TasksPage } from '../pages/admin/TasksPage';
import { TaskDetailPage } from '../pages/admin/TaskDetailPage';
import { CompletedTasksPage } from '../pages/admin/CompletedTasksPage';
import { ActivityPage } from '../pages/admin/ActivityPage';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// Member Pages
import { MemberDashboardPage } from '../pages/member/MemberDashboardPage';
import { MemberTasksPage } from '../pages/member/MemberTasksPage';
import { MemberTaskDetailPage } from '../pages/member/MemberTaskDetailPage';
import { MemberCompletedTasksPage } from '../pages/member/MemberCompletedTasksPage';
import { MemberActivityPage } from '../pages/member/MemberActivityPage';
import { MemberProfilePage } from '../pages/member/MemberProfilePage';

// 404
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading TeamPulse...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/member/dashboard" replace />
          )
        }
      />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="completed-tasks" element={<CompletedTasksPage />} />
        <Route path="checkins" element={<Navigate to="/admin/completed-tasks" replace />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Member Protected Routes */}
      <Route path="/member" element={<MemberLayout />}>
        <Route index element={<Navigate to="/member/dashboard" replace />} />
        <Route path="dashboard" element={<MemberDashboardPage />} />
        <Route path="tasks" element={<MemberTasksPage />} />
        <Route path="tasks/:id" element={<MemberTaskDetailPage />} />
        <Route path="completed-tasks" element={<MemberCompletedTasksPage />} />
        <Route path="checkin" element={<Navigate to="/member/completed-tasks" replace />} />
        <Route path="activity" element={<MemberActivityPage />} />
        <Route path="profile" element={<MemberProfilePage />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
