import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import apiClient, { setAuthToken } from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  usn: string;
  college: string;
  branch: string;
  semester: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setAuthToken(null);
      setLoading(false);
      return;
    }

    try {
      setAuthToken(token);
      const response = await apiClient.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('token');
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};