import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ActivitySquare, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
        <ActivitySquare className="w-8 h-8" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-8">
        The requested page could not be located or you may not have sufficient permissions to access it.
      </p>
      <Button onClick={handleGoHome} icon={<Home className="w-4 h-4" />}>
        Return to Dashboard
      </Button>
    </div>
  );
};
