'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api/client';

interface User {
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, tenant?: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = getAuthToken();

    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // Decode token payload (without verification — that's the server's job)
      try {
        const parts = savedToken.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUser({ username: decoded.username, role: decoded.role });
        }
      } catch {
        clearAuthToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string, tenant?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, tenant }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      const newToken = data.token;

      setAuthToken(newToken);
      setToken(newToken);

      // Decode user from token
      try {
        const parts = newToken.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUser({ username: decoded.username, role: decoded.role });
        }
      } catch {
        setUser({ username });
      }

      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('tenant');
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
};
