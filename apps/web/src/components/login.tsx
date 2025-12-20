'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      roles: string[];
      metadata: { tenant: string };
    };
    tenant: string;
  };
}

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('default');

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; tenant: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': data.tenant,
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      // Tokens are stored in httpOnly cookies, user info can be fetched from API if needed
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password, tenant });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SONATE Login</CardTitle>
          <CardDescription>
            Sign in to access the SONATE platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tenant" className="block text-sm font-medium text-gray-700">
                Tenant
              </label>
              <Input
                id="tenant"
                type="text"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="default"
                required
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <div aria-live="polite" aria-atomic="true">
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                aria-describedby={loginMutation.isPending ? "loading-status" : loginMutation.isError ? "error-message" : undefined}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
              {loginMutation.isPending && (
                <p id="loading-status" className="sr-only">
                  Signing in, please wait.
                </p>
              )}
              {loginMutation.isError && (
                <p id="error-message" className="text-red-600 text-sm" role="alert">
                  Login failed. Please try again.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
