import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store in sessionStorage (unlimited TTL until browser closes)
      sessionStorage.setItem('token', data.data.token);
      sessionStorage.setItem('user', JSON.stringify(data.data.user));

      setToken(data.data.token);
      setUser(data.data.user);

      // Redirect to calendar
      router.push('/calendar');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    if (!token) return;

    console.log('Refreshing user data...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log('User data from /auth/me:', data);

      if (data.success) {
        console.log('User avatar_url:', data.data.avatar_url);
        setUser(data.data);
        sessionStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('avatar', file);

    console.log('Uploading avatar:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      console.log('Upload response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      console.log('Avatar uploaded successfully, URL:', data.data.avatar_url);

      // Refresh user data
      await refreshUser();
      
      console.log('User data refreshed after avatar upload');
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  };

  const deleteAvatar = async () => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/delete-avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete avatar');
      }

      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Delete avatar error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
    refreshUser,
    uploadAvatar,
    deleteAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
