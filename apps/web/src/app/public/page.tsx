'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublicAccess() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-cyan-400 mb-4">SONATE</h1>
          <p className="text-2xl text-slate-300">Loading Demo...</p>
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
          SONATE Demo
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-2">Enterprise AI Trust Platform</p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Experience the future of AI governance and trust
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8"
            onClick={async () => {
              try {
                // Auto-login as demo user
                const response = await fetch('/api/auth/demo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                  sessionStorage.setItem('tenant', data.data.tenant || 'demo');
                  sessionStorage.setItem('user', JSON.stringify(data.data.user || {}));
                  window.location.href = '/dashboard';
                }
              } catch (error) {
                // Fallback to direct navigation
                window.location.href = '/dashboard';
              }
            }}
          >
            🚀 Start Demo (No Login Required)
          </Button>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8">
              📖 Learn More
            </Button>
          </Link>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <h3 className="text-xl font-semibold text-cyan-400 mb-4">Demo Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-white font-medium">Real-time AI Monitoring</div>
                <div className="text-slate-400 text-sm">Live detection and resonance scoring</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-white font-medium">Trust Protocol</div>
                <div className="text-slate-400 text-sm">Constitutional AI governance</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-white font-medium">Quantum Security</div>
                <div className="text-slate-400 text-sm">Ed25519 cryptographic signatures</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-white font-medium">Enterprise Dashboard</div>
                <div className="text-slate-400 text-sm">Complete analytics and oversight</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-2">
            Share this link: <code className="bg-slate-700 px-2 py-1 rounded text-cyan-400">{typeof window !== 'undefined' ? window.location.origin : ''}/public</code>
          </p>
          <p className="text-slate-600 text-xs">
            No registration required • Instant access • Full demo experience
          </p>
        </div>
      </div>
    </section>
  );
}
