'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Bot,
  Fingerprint,
  Activity,
  ChevronRight,
  Play,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  Waves,
  Lock,
  Eye,
  Zap,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Narrative story steps ────────────────────────────────────────────────────
interface StoryStep {
  id: string;
  chapter: string;
  headline: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  metric?: { label: string; value: string; trend?: string };
  cta?: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    id: 'problem',
    chapter: 'The Problem',
    headline: 'Your AI agents are making decisions. Do you know what they said?',
    body:
      "Every day, AI systems interact with your customers, employees, and data — with no cryptographic record, no audit trail, and no constitutional guardrails. One hallucination, one policy violation, one unexplained decision. That's your liability.",
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-500',
    metric: { label: 'Unverified AI interactions per day', value: '10,000+', trend: '↑ growing' },
  },
  {
    id: 'trust-receipt',
    chapter: 'The Solution',
    headline: 'SONATE creates a Trust Receipt for every single AI interaction.',
    body:
      'Every prompt, every response, every decision — cryptographically signed with Ed25519, hash-chained like a blockchain, and scored against 6 constitutional principles. Tamper-proof. Auditable. Yours.',
    icon: Fingerprint,
    color: 'from-purple-500 to-cyan-500',
    metric: { label: 'Trust Receipt generated in', value: '< 50ms', trend: '✓ zero latency overhead' },
  },
  {
    id: 'monitoring',
    chapter: 'Live Monitoring',
    headline: 'Watch your AI fleet in real-time. Catch drift before it becomes a crisis.',
    body:
      'The SONATE dashboard surfaces trust scores, behavioral drift, linguistic emergence patterns, and constitutional violations — all in real-time. Your compliance team finally has the data they need.',
    icon: Activity,
    color: 'from-cyan-500 to-blue-500',
    metric: { label: 'Average trust score across fleet', value: '8.7 / 10', trend: '↑ +0.3 this week' },
  },
  {
    id: 'overseer',
    chapter: 'The Overseer',
    headline: 'An autonomous governance loop that thinks, recommends, and acts.',
    body:
      "The System Brain (Overseer) continuously analyzes your AI fleet, generates governance recommendations, and — when you're ready — enforces constitutional principles automatically. Advisory mode by default. Enforced when you choose.",
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    metric: { label: 'Governance recommendations generated', value: '24 / week', trend: '↓ issues resolved' },
  },
  {
    id: 'lab',
    chapter: 'Research Lab',
    headline: 'Experiment safely. Compare models. Measure emergence.',
    body:
      'The Lab module lets your research team run controlled experiments, compare model behaviors side-by-side, and measure Bedau emergence indices — all in an isolated sandbox that never touches production.',
    icon: FlaskConical,
    color: 'from-amber-500 to-orange-500',
    metric: { label: 'Models compared in last session', value: '4 models', trend: '→ GPT-4 vs Claude 3' },
  },
  {
    id: 'proof',
    chapter: 'Public Verification',
    headline: 'Anyone can verify a Trust Receipt. No account required.',
    body:
      'Share a Trust Receipt with a regulator, auditor, or customer. They paste it into the public verifier at /proof and instantly see: schema valid, signature valid, chain intact. Cryptographic trust, no middleman.',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    metric: { label: 'Verification checks per receipt', value: '4 checks', trend: '✓ schema · sig · chain · hash' },
  },
];

// ─── Floating particle background ────────────────────────────────────────────
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 animate-pulse"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#10b981',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ─── Story step card ──────────────────────────────────────────────────────────
function StoryCard({
  step,
  isActive,
  onClick,
}: {
  step: StoryStep;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
        isActive
          ? 'border-cyan-500/50 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
          : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-600/50 hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${step.color} ${
            isActive ? 'opacity-100' : 'opacity-60'
          }`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            {step.chapter}
          </p>
          <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-400'}`}>
            {step.headline}
          </p>
        </div>
        {isActive && <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0 mt-1" />}
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STEP_DURATION = 6000; // ms per step

  const currentStep = STORY_STEPS[activeStep];
  const CurrentIcon = currentStep.icon;

  // Auto-advance story
  useEffect(() => {
    if (!autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / STEP_DURATION) * 100, 100));
    }, 50);

    intervalRef.current = setInterval(() => {
      setActiveStep(prev => {
        const next = (prev + 1) % STORY_STEPS.length;
        return next;
      });
      setProgress(0);
    }, STEP_DURATION);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [autoPlay, activeStep]);

  const handleStepClick = (index: number) => {
    setAutoPlay(false);
    setActiveStep(index);
    setProgress(0);
  };

  const handleEnterDemo = async () => {
    setIsEntering(true);
    try {
      // Call guest auth
      await fetch('/api/auth/guest?tenantId=demo-tenant', { method: 'POST' });
    } catch {
      // Continue even if auth fails — demo mode works via localStorage
    }
    localStorage.setItem('yseeku-demo-mode', 'true');
    router.push('/dashboard?demo=true');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <ParticleBackground />

      {/* ── Top nav ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">SONATE</span>
            <p className="text-[10px] text-slate-500 -mt-1">AI Trust Platform</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/proof">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Verify Receipt</span>
            </Button>
          </Link>
          <Button
            onClick={handleEnterDemo}
            disabled={isEntering}
            size="sm"
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white gap-2"
          >
            {isEntering ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Enter Demo
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Hero + Story ── */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-0">
        {/* Left: Story narrative */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-12 lg:py-16 max-w-2xl">
          {/* Chapter label */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${currentStep.color}`} />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {currentStep.chapter}
            </span>
            <span className="text-xs text-slate-600">
              {activeStep + 1} / {STORY_STEPS.length}
            </span>
          </div>

          {/* Headline */}
          <h1
            key={currentStep.id + '-headline'}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 transition-all"
          >
            {currentStep.headline}
          </h1>

          {/* Body */}
          <p
            key={currentStep.id + '-body'}
            className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl"
          >
            {currentStep.body}
          </p>

          {/* Metric callout */}
          {currentStep.metric && (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 mb-8 w-fit">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${currentStep.color}`}>
                <CurrentIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{currentStep.metric.value}</p>
                <p className="text-xs text-slate-400">{currentStep.metric.label}</p>
                {currentStep.metric.trend && (
                  <p className="text-xs text-emerald-400 mt-0.5">{currentStep.metric.trend}</p>
                )}
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleEnterDemo}
              disabled={isEntering}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white gap-2 px-8"
            >
              {isEntering ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Entering Platform...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Enter Platform Demo
                </>
              )}
            </Button>
            <Link href="/proof">
              <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-2">
                <Shield className="h-5 w-5" />
                Try Receipt Verifier
              </Button>
            </Link>
          </div>

          {/* Auto-play progress */}
          {autoPlay && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-slate-800 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full bg-gradient-to-r ${currentStep.color} transition-none`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={() => setAutoPlay(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Pause story
              </button>
            </div>
          )}
          {!autoPlay && (
            <button
              onClick={() => setAutoPlay(true)}
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              Resume auto-play
            </button>
          )}
        </div>

        {/* Right: Story chapter list */}
        <div className="lg:w-96 px-6 py-8 lg:py-16 lg:border-l border-slate-800/50 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Platform Story
          </p>
          {STORY_STEPS.map((step, index) => (
            <StoryCard
              key={step.id}
              step={step}
              isActive={index === activeStep}
              onClick={() => handleStepClick(index)}
            />
          ))}

          {/* Trust badges */}
          <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2">
            {[
              { icon: Lock, label: 'Ed25519 Cryptographic Signing' },
              { icon: Fingerprint, label: 'SHA-256 Hash Chains' },
              { icon: CheckCircle2, label: '6 Constitutional Principles' },
              { icon: Zap, label: '< 50ms Receipt Generation' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Feature strip ── */}
      <footer className="relative z-10 border-t border-slate-800/50 px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Fingerprint, label: 'Trust Receipts', color: 'text-purple-400' },
            { icon: Activity, label: 'Live Monitoring', color: 'text-cyan-400' },
            { icon: Brain, label: 'System Brain', color: 'text-violet-400' },
            { icon: FlaskConical, label: 'Research Lab', color: 'text-amber-400' },
            { icon: Waves, label: 'Drift Detection', color: 'text-blue-400' },
            { icon: Shield, label: 'Public Verifier', color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon className={`h-6 w-6 ${color}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}