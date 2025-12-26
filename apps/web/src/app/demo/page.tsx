'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DemoHome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-cyan-400 mb-4">SONATE</h1>
          <p className="text-2xl text-slate-300">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-purple-500/20 rounded-full" />
      </div>
      
      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          SONATE
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-2">Enterprise AI Trust Platform</p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Constitutional AI Governance with Quantum-Grade Security
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8">
              Open Dashboard
            </Button>
          </Link>
          <Link href="/demo/lab">
            <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8">
              Explore Lab
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-cyan-400">DETECT</div>
            <div className="text-sm text-slate-400 mt-1">Live Monitoring</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400">LAB</div>
            <div className="text-sm text-slate-400 mt-1">Research Sandbox</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">ORCHESTRATE</div>
            <div className="text-sm text-slate-400 mt-1">Enterprise Admin</div>
          </div>
        </div>
      </div>
    </section>
  );
}
