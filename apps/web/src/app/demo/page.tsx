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
      // Guest session unavailable — proceed in demo mode without a server session
    }

    // Enable demo mode and redirect
    if (typeof window !== 'undefined') {
      localStorage.setItem('yseeku-demo-mode', 'true');
    }

    try {
      router.push('/dashboard?demo=true');
    } catch {
      setIsRedirecting(false);
    }
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
          <Link href="https://github.com/s8ken/yseeku-platform/blob/main/docs/TRUST_RECEIPT_SPECIFICATION_v1.md" target="_blank">
            <span className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
              <Shield className="h-4 w-4" />
              SONATE Protocol v1.0
            </span>
          </Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          AI actions should be <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">verifiable.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-6 font-medium">
          SONATE creates cryptographic receipts for every AI decision.
        </p>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The open standard for AI trust. Signed, hash-chained, and verifiable 
          independent of the provider. Experience the YSEEKU enterprise orchestration 
          platform in action.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            onClick={handleEnterDemo}
            disabled={isRedirecting}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-10 py-7 text-xl shadow-lg shadow-cyan-500/20"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Initializing Protocol...
              </>
            ) : (
              <>
                Enter Platform Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          <Link href="https://www.npmjs.com/package/sonate-receipt" target="_blank">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-10 py-7 text-xl">
              npm install sonate-receipt
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center justify-center gap-8 mb-16 grayscale opacity-50">
           <div className="text-slate-400 font-mono text-sm tracking-widest uppercase">Layer 1: SONATE</div>
           <div className="w-12 h-px bg-slate-700"></div>
           <div className="text-slate-400 font-mono text-sm tracking-widest uppercase">Layer 2: YSEEKU</div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-left transition-all hover:border-cyan-500/50 group">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Detect</h3>
            <p className="text-slate-400 leading-relaxed">Continuous verification of SONATE receipts with real-time drift & emergence monitoring.</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-left transition-all hover:border-purple-500/50 group">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FlaskConical className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lab</h3>
            <p className="text-slate-400 leading-relaxed">Model-agnostic playground for stress-testing prompts against the SONATE principles.</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-left transition-all hover:border-emerald-500/50 group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Orchestrate</h3>
            <p className="text-slate-400 leading-relaxed">Enterprise-grade governance, automated audits, and multi-tenant fleet management.</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-12 bg-slate-900/50 py-2 px-6 rounded-full inline-block border border-slate-800">
          Independent Verification • Provider Agnostic • Open Protocol
        </p>

        <p className="text-sm text-slate-500 mt-4">
          Demo uses sample data. No account required.
        </p>
      </div>
    </section>
  );
}
