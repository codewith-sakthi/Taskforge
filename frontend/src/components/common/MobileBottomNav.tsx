import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CheckCircle2,
  BarChart3,
  User,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { isAdmin } = useAuth();

  const adminNavItems = [
    { label: 'Home', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Members', path: '/admin/members', icon: Users },
    { label: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
    { label: 'Completed', path: '/admin/completed-tasks', icon: CheckCircle2 },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const memberNavItems = [
    { label: 'Home', path: '/member/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', path: '/member/tasks', icon: CheckSquare },
    { label: 'Completed', path: '/member/completed-tasks', icon: CheckCircle2 },
    { label: 'Profile', path: '/member/profile', icon: User },
  ];

  const items = isAdmin ? adminNavItems : memberNavItems;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
