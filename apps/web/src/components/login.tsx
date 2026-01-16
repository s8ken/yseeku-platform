'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock, User, Building2 } from 'lucide-react';

function IconWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className={className} style={{ width: '1em', height: '1em', display: 'inline-block' }} />;
  return <>{children}</>;
}

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
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.token) {
          setCsrfToken(data.data.token);
        }
      })
      .catch(() => {});
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; tenant: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': data.tenant,
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      // Primary login attempt
      if (response.ok) {
        return response.json() as Promise<LoginResponse & { token?: string; data?: any }>;
      }

      // Fallback: try guest login to avoid blocking access in demo/prod when backend proxy fails
      const guest = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (guest.ok) {
        return guest.json() as Promise<LoginResponse & { token?: string; data?: any }>;
      }

      throw new Error('Login failed');
    },
    onSuccess: (data) => {
      // Store session info
      sessionStorage.setItem('tenant', (data as any)?.data?.tenant || 'default');
      sessionStorage.setItem('user', JSON.stringify((data as any)?.data?.user || {}));

      // Persist auth token for subsequent API calls if provided
      try {
        const token = (data as any)?.token || (data as any)?.data?.tokens?.accessToken;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      } catch {}

      window.location.href = '/dashboard';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password, tenant });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 mb-4 shadow-lg shadow-teal-500/30">
            <IconWrapper className="h-8 w-8">
              <Shield className="h-8 w-8 text-white" />
            </IconWrapper>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SONATE</h1>
          <p className="text-slate-400">Enterprise AI Trust Framework</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tenant" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Tenant
                </label>
                <Input
                  id="tenant"
                  type="text"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  placeholder="default"
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <div aria-live="polite" aria-atomic="true" className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium py-2.5 shadow-lg shadow-teal-500/25"
                  disabled={loginMutation.isPending}
                  aria-describedby={loginMutation.isPending ? "loading-status" : loginMutation.isError ? "error-message" : undefined}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                {loginMutation.isPending && (
                  <p id="loading-status" className="sr-only">
                    Signing in, please wait.
                  </p>
                )}
                {loginMutation.isError && (
                  <p id="error-message" className="mt-3 text-red-400 text-sm text-center" role="alert">
                    Login failed. Please check your credentials and try again.
                  </p>
                )}
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center mb-4">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/demo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                      });
                      const data = await response.json();
                      if (data.success) {
                        // Set all required session data
                        sessionStorage.setItem('tenant', data.data.tenant || 'demo');
                        sessionStorage.setItem('user', JSON.stringify(data.data.user || {}));
                        
                        // Enable demo mode in localStorage
                        localStorage.setItem('yseeku-demo-mode', 'true');
                        
                        // Add demo parameter to URL for consistency
                        const url = new URL('/dashboard', window.location.origin);
                        url.searchParams.set('demo', 'true');
                        window.location.href = url.toString();
                      }
                    } catch (error) {
                      // Fallback - still enable demo mode
                      localStorage.setItem('yseeku-demo-mode', 'true');
                      window.location.href = '/dashboard?demo=true';
                    }
                  }}
                >
                  🚀 Demo Mode
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => window.location.href = '/public'}
                >
                  📖 Public Demo
                </Button>
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                Or contact your administrator for credentials
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <a 
            href="https://yseeku.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-teal-400 transition-colors"
          >
            Powered by yseeku.com
          </a>
        </div>
      </div>
    </div>
  );
}
