'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowRight, Shield, Activity, FlaskConical } from 'lucide-react';

export default function DemoHome() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnterDemo = async () => {
    setIsRedirecting(true);
    
    // Get guest session with cookie before redirecting
    try {
      await fetch('/api/auth/guest', { method: 'POST' });
    } catch {
      // Continue anyway - middleware will handle redirect if needed
    }
    
    // Enable demo mode and redirect
    if (typeof window !== 'undefined') {
      localStorage.setItem('yseeku-demo-mode', 'true');
    }
    router.push('/dashboard?demo=true');
  };

  if (!mounted) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-cyan-400 mb-4">YSEEKU</h1>
          <p className="text-2xl text-slate-300">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-purple-500/20 rounded-full" />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full border border-cyan-500/30">
            <Shield className="h-4 w-4" />
            The Trust Layer for AI
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          YSEEKU
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-2">Enterprise AI Trust Platform</p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Cryptographic proof for every AI interaction. Real-time drift detection.
          Enterprise compliance out of the box.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            onClick={handleEnterDemo}
            disabled={isRedirecting}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-8 py-6 text-lg"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entering Demo...
              </>
            ) : (
              <>
                Try Interactive Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          <Link href="https://docs.yseeku.com" target="_blank">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg">
              Read Documentation
            </Button>
          </Link>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-left">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Detect</h3>
            <p className="text-sm text-slate-400">Real-time trust monitoring with cryptographic receipts and drift detection</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-left">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <FlaskConical className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lab</h3>
            <p className="text-sm text-slate-400">Experiment with prompts, compare models, and analyze emergence patterns</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-left">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Orchestrate</h3>
            <p className="text-sm text-slate-400">Enterprise governance, compliance reporting, and multi-tenant management</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-12">
          Demo uses sample data. No account required.
        </p>
      </div>
    </section>
  );
}
