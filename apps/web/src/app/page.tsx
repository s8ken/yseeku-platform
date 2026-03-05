"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Providers } from './providers';

const Login = dynamic(() => import('../components/login').then(mod => mod.Login), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="animate-pulse text-white">Loading...</div>
    </div>
  )
});

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for session token — if not present, redirect to demo experience
    const hasToken =
      document.cookie.includes('session_token') ||
      typeof window !== 'undefined' && localStorage.getItem('token');
    if (!hasToken) {
      router.replace('/demo');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Providers>
      <Login />
    </Providers>
  );
}
