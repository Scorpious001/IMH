import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  canViewModule: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await authService.getUser();
      // Ensure user data is set correctly
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // If not authenticated (401/403), that's okay - user will need to log in
      // Log the error for debugging
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('User not authenticated - login required');
      } else {
        console.error('Error checking auth:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      // The login response has { user: {...}, message: '...', token: '...' }
      const userData = response.user || response;
      // Ensure we have the user object with all fields
      if (userData && (userData.role || userData.is_superuser)) {
        setUser(userData);
        setIsLoading(false);
      } else {
        // If user data is incomplete, fetch it
        await checkAuth();
      }
    } catch (error: any) {
      setIsLoading(false);
      // Better error handling
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) {
      return false;
    }
    
    // Admins have all permissions - check multiple ways
    // Check role from user object (case-insensitive)
    if (user.role && String(user.role).toUpperCase() === 'ADMIN') {
      return true;
    }
    
    // Check is_superuser flag (explicitly check for true)
    if (user.is_superuser === true) {
      return true;
    }
    
    // Check profile role
    if (user.profile?.role && String(user.profile.role).toUpperCase() === 'ADMIN') {
      return true;
    }
    
    // Check if user has the specific permission
    const permissionName = `${module}.${action}`;
    return user.permissions?.includes(permissionName) || false;
  };

  const canViewModule = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    canViewModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

