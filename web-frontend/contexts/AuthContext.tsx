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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/me`;
        const response = await fetch(endpoint, {
          credentials: 'include', // Send cookies
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error('[Auth Error] Failed to check authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/login`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.data.user);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('[Auth Error] Login failed:', {
        endpoint,
        method: 'POST',
        email,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/logout`;
      await fetch(endpoint, {
        method: 'POST',
        credentials: 'include', // Send cookies
      });
    } catch (error) {
      console.error('[Auth Error] Logout failed:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    console.log('Refreshing user data...');

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/me`;
    try {
      const response = await fetch(endpoint, {
        credentials: 'include', // Send cookies
      });

      const data = await response.json();

      console.log('User data from /auth/me:', data);

      if (data.success) {
        console.log('User avatar_url:', data.data.avatar_url);
        setUser(data.data);
      }
    } catch (error) {
      console.error('[Auth Error] Failed to refresh user:', {
        endpoint,
        method: 'GET',
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
    }
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('Uploading avatar:', { fileName: file.name, fileSize: file.size, fileType: file.type });

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/upload-avatar`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include', // Send cookies
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
      console.error('[Auth Error] Failed to upload avatar:', {
        endpoint,
        method: 'POST',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      throw error;
    }
  };

  const deleteAvatar = async () => {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/delete-avatar`;
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include', // Send cookies
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete avatar');
      }

      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('[Auth Error] Failed to delete avatar:', {
        endpoint,
        method: 'DELETE',
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      });
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    uploadAvatar,
    deleteAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
