import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authAPI from '@/api/auth';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: 'Admin' | 'Instructor' | 'Student';
  avatar?: string;
  profilePhotoUrl?: string;
  bio?: string;
  company?: string;
  address?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string, role: string, departmentId?: number, profileData?: {
    bio?: string;
    address?: string;
    dateOfBirth?: string;
    company?: string;
    profileImage?: File;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response;

      if (!userData) {
        throw new Error('No user data returned from server');
      }

      const userObj: User = {
        id: userData.id || '',
        email: userData.email,
        role: (userData.role as 'Admin' | 'Instructor' | 'Student') || 'Student',
        avatar: undefined,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, role: string, departmentId?: number, profileData?: {
    bio?: string;
    address?: string;
    dateOfBirth?: string;
    company?: string;
    profileImage?: File;
  }) => {
    try {
      const response = await authAPI.register({
        email,
        password,
        confirmPassword,
        userName: name,
        role: role as 'Student' | 'Instructor' | 'Admin',
        departmentId: departmentId || null,
        bio: profileData?.bio,
        address: profileData?.address,
        dateOfBirth: profileData?.dateOfBirth,
        company: profileData?.company,
        profileImage: profileData?.profileImage,
      });

      const { token, user: userData } = response;

      if (!userData) {
        throw new Error('No user data returned from server');
      }

      const userObj: User = {
        id: userData.id || '',
        email: userData.email,
        role: (userData.role as 'Admin' | 'Instructor' | 'Student') || 'Student',
        avatar: undefined,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
    } catch (error: unknown) {
      console.error('Register error:', error);
      const ax = error as { response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } } };
      const data = ax.response?.data;
      let errorMsg = 'Registration failed. Please try again.';
      if (data?.message) errorMsg = data.message;
      else if (data?.error) errorMsg = data.error;
      else if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat().find(Boolean);
        if (first) errorMsg = first;
      }
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
