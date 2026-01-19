/**
 * Authentication API
 */

import { fetchAPI, clearAuthToken } from './client';

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences?: {
    defaultModel?: string;
    theme?: string;
    notifications?: boolean;
  };
  apiKeys?: Array<{
    provider: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  }>;
  createdAt: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async guestLogin(): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/api/auth/guest', {
      method: 'POST',
    });
  },

  async getProfile(): Promise<{ success: boolean; data: { user: UserProfile } }> {
    return fetchAPI('/api/auth/me');
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean }> {
    return fetchAPI('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async refreshToken(refreshToken: string): Promise<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string } } }> {
    return fetchAPI('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout(): void {
    clearAuthToken();
  },
};

export default authApi;
