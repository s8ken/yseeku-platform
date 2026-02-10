'use client';

import { useCallback, useEffect, useState } from 'react';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const TOKEN_KEY = 'auth_token';
const EXPIRY_KEY = 'auth_expiry';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);

    if (savedToken && expiry) {
      const now = Date.now();
      if (now < parseInt(expiry)) {
        setToken(savedToken);
        setIsAuthenticated(true);
        // Decode token to get username (simple JWT decode without verification)
        try {
          const parts = savedToken.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));
            setUser({ username: decoded.username });
          }
        } catch (err) {
          console.error('Failed to decode token:', err);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(EXPIRY_KEY);
        }
      } else {
        // Token expired
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const { token: newToken, expiresIn } = data;

      // Calculate expiry time
      const expiryTime = Date.now() + expiresIn * 1000;

      // Store token and expiry
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

      setToken(newToken);
      setUser({ username });
      setIsAuthenticated(true);

      // Set up token refresh before expiry
      setTimeout(() => {
        refreshToken();
      }, (expiresIn - 60) * 1000); // Refresh 60 seconds before expiry
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshToken = useCallback(async () => {
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/v2/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { token: newToken, expiresIn } = data;

      const expiryTime = Date.now() + expiresIn * 1000;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

      setToken(newToken);

      // Schedule next refresh
      setTimeout(() => {
        refreshToken();
      }, (expiresIn - 60) * 1000);
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
    }
  }, [token]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  };
};
