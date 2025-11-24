import React, { createContext, useContext, useState, useEffect } from 'react';
import { type UserResponse } from '../types/auth';
import { authService } from '../utils/auth';
import { apiService } from '../api/api';
import { websocketService } from '../api/websocket';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const connectWebSocket = async (token: string) => {
  try {
    await websocketService.connect(token);
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
  }
};

const disconnectWebSocket = () => {
  websocketService.disconnect();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          await websocketService.connect(token);
        } catch (error) {
          console.error('Failed to get current user:', error);
          authService.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
       websocketService.disconnect();
    };
  }, []);

  const login = async (userData: UserResponse) => {
    setUser(userData);
    const token = authService.getAccessToken();
    if (token) {
      try {
        await websocketService.connect(token);
      } catch (error) {
        console.error('Failed to connect WebSocket after login:', error);
      }
    }
  };

  const logout = () => {
    setUser(null);
    authService.clearTokens();
    websocketService.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};