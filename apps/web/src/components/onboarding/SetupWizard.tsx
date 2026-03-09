'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Shield,
  Bot,
  Fingerprint,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/hooks/use-demo';
import { useRouter } from 'next/navigation';

const SETUP_WIZARD_KEY = 'yseeku-setup-wizard-completed';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SONATE',
    subtitle: 'Your AI Trust Platform',
    icon: Shield,
    color: 'from-emerald-500 to-blue-600',
  },
  {
    id: 'connect',
    title: 'Connect Your AI Agent',
    subtitle: 'Step 2 of 4',
    icon: Bot,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'receipt',
    title: 'Your First Trust Receipt',
    subtitle: 'Step 3 of 4',
    icon: Fingerprint,
    color: 'from-purple-500 to-cyan-600',
  },
  {
    id: 'ready',
    title: 'Dashboard Ready',
    subtitle: 'Step 4 of 4',
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-600',
  },
];

const SAMPLE_SNIPPET = `import { SonateClient } from '@sonate/sdk';

const sonate = new SonateClient({
  apiKey: process.env.SONATE_API_KEY,
  tenantId: process.env.SONATE_TENANT_ID,
});

// Wrap any AI call to generate a Trust Receipt
const receipt = await sonate.trust({
  agentId: 'my-gpt4-agent',
  prompt: userMessage,
  response: await callYourLLM(userMessage),
});

console.log('Trust Receipt:', receipt.id);
// → "tr_a1b2c3d4e5f6..."`;

export function SetupWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const { enableDemo, isDemo } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(SETUP_WIZARD_KEY);
      const onboardingCompleted = localStorage.getItem('yseeku-onboarding-completed');
      // Show setup wizard only if onboarding was completed (user chose Live Mode)
      // and setup wizard hasn't been completed yet
      if (!completed && onboardingCompleted && !isDemo) {
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isDemo]);

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_WIZARD_KEY, 'true');
    }
    setIsOpen(false);
    router.push('/dashboard');
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_WIZARD_KEY, 'skipped');
    }
    setIsOpen(false);
  };

  const handleStartDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_WIZARD_KEY, 'demo');
    }
    enableDemo();
    setIsOpen(false);
  };

  const handleCopySnippet = async () => {
    await navigator.clipboard.writeText(SAMPLE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-4 px-6">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  i < currentStep
                    ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                    : i === currentStep
                    ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white'
                    : 'bg-muted text-muted-foreground cursor-default'
                )}
              >
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 transition-all duration-500',
                    i < currentStep ? 'bg-emerald-500' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="p-6">
          {/* Step 1: Welcome */}
          {currentStep === 0 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg', step.color)}>
                  <StepIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to SONATE</h2>
                <p className="text-muted-foreground">
                  The AI Trust Platform that gives you cryptographic proof of every AI interaction.
                  Let's get you set up in 4 quick steps.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: Shield, label: 'Trust Receipts', desc: 'Cryptographic proof for every AI call', color: 'text-purple-500' },
                  { icon: Bot, label: 'Agent Monitoring', desc: 'Track all your AI agents in real-time', color: 'text-cyan-500' },
                  { icon: Fingerprint, label: 'Hash Chains', desc: 'Immutable audit trail via Ed25519', color: 'text-amber-500' },
                  { icon: Sparkles, label: 'Compliance', desc: '6 constitutional principles enforced', color: 'text-emerald-500' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                    <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', color)} />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleStartDemo} variant="outline" className="flex-1 gap-2">
                  <Play className="h-4 w-4" />
                  Try Demo First
                </Button>
                <Button onClick={goNext} className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
                  Start Setup
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Connect AI Agent */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', step.color)}>
                  <StepIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect Your AI Agent</h2>
                  <p className="text-sm text-muted-foreground">Add the SONATE SDK to your existing AI application</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold">1</div>
                  <p className="text-sm font-medium">Install the SDK</p>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 font-mono text-sm text-slate-200 flex items-center justify-between">
                  <span>npm install @sonate/sdk</span>
                  <button
                    onClick={() => navigator.clipboard.writeText('npm install @sonate/sdk')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold">2</div>
                  <p className="text-sm font-medium">Wrap your AI calls</p>
                </div>
                <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-auto max-h-48">
                  <button
                    onClick={handleCopySnippet}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="whitespace-pre-wrap">{SAMPLE_SNIPPET}</pre>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold">3</div>
                  <p className="text-sm font-medium">Get your API key</p>
                </div>
                <a
                  href="/dashboard/api"
                  className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all text-sm text-cyan-600 dark:text-cyan-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Developer Hub → API Keys
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </a>
              </div>
            </div>
          )}

          {/* Step 3: First Trust Receipt */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', step.color)}>
                  <StepIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your First Trust Receipt</h2>
                  <p className="text-sm text-muted-foreground">Understand what gets recorded for every AI interaction</p>
                </div>
              </div>

              <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/20 dark:to-cyan-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold text-sm">Sample Trust Receipt</span>
                  <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium">VERIFIED</span>
                </div>
                {[
                  { label: 'Receipt ID', value: 'tr_a1b2c3d4e5f6...', mono: true },
                  { label: 'Agent', value: 'gpt-4-turbo (did:sonate:agent0x...)', mono: true },
                  { label: 'Trust Score', value: '9.2 / 10', mono: false },
                  { label: 'Principles', value: '6/6 Constitutional checks passed', mono: false },
                  { label: 'Signature', value: 'Ed25519 ✓ Valid', mono: true },
                  { label: 'Chain Hash', value: 'SHA-256 ✓ Intact', mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">What SONATE records:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Prompt & response hash',
                    'Agent identity (DID)',
                    'Constitutional scores',
                    'Cryptographic signature',
                    'Hash chain link',
                    'Timestamp & session',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="/proof"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all text-sm text-purple-600 dark:text-purple-400"
              >
                <Shield className="h-4 w-4" />
                Try the public receipt verifier
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            </div>
          )}

          {/* Step 4: Dashboard Ready */}
          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg', step.color)}>
                    <StepIcon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
                <p className="text-muted-foreground">
                  Your SONATE platform is ready. Here's what to explore first:
                </p>
              </div>

              <div className="space-y-2 text-left">
                {[
                  { href: '/dashboard', label: 'Platform Overview', desc: 'Your trust score and KPIs at a glance', icon: Shield, color: 'text-emerald-500' },
                  { href: '/dashboard/chat', label: 'Trust Session', desc: 'Start a monitored AI conversation', icon: Sparkles, color: 'text-cyan-500' },
                  { href: '/dashboard/agents', label: 'Register Agents', desc: 'Add your AI agents to the registry', icon: Bot, color: 'text-purple-500' },
                  { href: '/dashboard/receipts', label: 'Trust Receipts', desc: 'View all cryptographic interaction logs', icon: Fingerprint, color: 'text-amber-500' },
                ].map(({ href, label, desc, icon: Icon, color }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={handleComplete}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', color)} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 gap-2"
              >
                <Zap className="h-4 w-4" />
                Open Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {currentStep > 0 && currentStep < WIZARD_STEPS.length - 1 && (
          <div className="flex items-center justify-between px-6 pb-5">
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip setup
              </button>
              <Button size="sm" onClick={goNext} className="gap-1">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="px-6 pb-5 -mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an AI app yet?{' '}
              <button onClick={handleStartDemo} className="text-purple-500 hover:underline">
                Try the demo instead
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}