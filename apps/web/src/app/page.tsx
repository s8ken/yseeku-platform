"use client";
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
  return (
    <Providers>
      <Login />
    </Providers>
  );
}
