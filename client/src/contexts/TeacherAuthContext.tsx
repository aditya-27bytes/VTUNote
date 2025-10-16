import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient, { setAuthToken } from '../utils/apiClient';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  qualification: string;
  experience: number;
  phone: string;
  college: string;
  subjects: string[];
  isVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  bio?: string;
  role: string;
}

interface TeacherAuthContextType {
  teacher: Teacher | null;
  loading: boolean;
  loginTeacher: (email: string, password: string) => Promise<void>;
  register: (teacherData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

const TeacherAuthContext = createContext<TeacherAuthContextType | undefined>(undefined);

export const useTeacherAuth = () => {
  const context = useContext(TeacherAuthContext);
  if (context === undefined) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return context;
};

interface TeacherAuthProviderProps {
  children: ReactNode;
}

export const TeacherAuthProvider: React.FC<TeacherAuthProviderProps> = ({ children }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if teacher is logged in on app start
    const teacherToken = localStorage.getItem('teacherToken');
    const teacherData = localStorage.getItem('teacherData');
    
    if (teacherToken && teacherData) {
      try {
        setAuthToken(teacherToken);
        const parsedTeacherData = JSON.parse(teacherData);
        setTeacher(parsedTeacherData);
      } catch (error) {
        console.error('Error parsing teacher data:', error);
        // Clear invalid data
        localStorage.removeItem('teacherData');
        localStorage.removeItem('teacherToken');
        setAuthToken(null);
      }
    }
    setLoading(false);
  }, []);

  const loginTeacher = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/teachers/login', { email, password });
      const data = response.data;
      
      if (!data || !data.token) {
        throw new Error('Invalid response from server - missing token');
      }
      
      // Store teacher-specific token and data
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherData', JSON.stringify(data));
      setAuthToken(data.token);
      
      setTeacher(data);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials and try again.';
      throw new Error(errorMessage);
    }
  };

  const register = async (teacherData: any) => {
    try {
      const response = await apiClient.post('/teachers/register', teacherData);
      const newTeacher = response.data;
      
      localStorage.setItem('teacherToken', newTeacher.token);
      localStorage.setItem('teacherData', JSON.stringify(newTeacher));
      setAuthToken(newTeacher.token);
      
      setTeacher(newTeacher);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
    setAuthToken(null);
    setTeacher(null);
  };

  // Verify token validity
  const verifyToken = async () => {
    try {
      const response = await apiClient.get('/teachers/me');
      if (response.data) {
        setTeacher(response.data);
        localStorage.setItem('teacherData', JSON.stringify(response.data));
        return true;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
      return false;
    }
    return false;
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await apiClient.put('/teachers/profile', profileData);
      const updatedTeacher = response.data;
      
      localStorage.setItem('teacherData', JSON.stringify(updatedTeacher));
      setTeacher(updatedTeacher);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: TeacherAuthContextType = {
    teacher,
    loading,
    loginTeacher,
    register,
    logout,
    updateProfile,
    verifyToken
  };

  return (
    <TeacherAuthContext.Provider value={value}>
      {children}
    </TeacherAuthContext.Provider>
  );
};
