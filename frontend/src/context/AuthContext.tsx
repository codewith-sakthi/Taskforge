import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('teampulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('teampulse_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load check
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('teampulse_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        localStorage.setItem('teampulse_user', JSON.stringify(response.data.user));
        connectSocket(storedToken);
      } catch (error) {
        console.error('Session validation failed:', error);
        localStorage.removeItem('teampulse_token');
        localStorage.removeItem('teampulse_user');
        setUser(null);
        setToken(null);
        disconnectSocket();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('teampulse_token', newToken);
    localStorage.setItem('teampulse_user', JSON.stringify(newUser));
    connectSocket(newToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore failure on logout endpoint
    } finally {
      localStorage.removeItem('teampulse_token');
      localStorage.removeItem('teampulse_user');
      setUser(null);
      setToken(null);
      disconnectSocket();
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedUser };
      localStorage.setItem('teampulse_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
        isMember: user?.role === 'MEMBER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
