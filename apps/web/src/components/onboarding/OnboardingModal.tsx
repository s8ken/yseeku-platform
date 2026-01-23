'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Activity,
  FlaskConical,
  Building2,
  ChevronRight,
  Play,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useDemo } from '@/hooks/use-demo';
import { useTutorialStore } from '@/store/useTutorialStore';
import { dashboardTutorialSteps } from '@/components/tutorial/steps';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'yseeku-onboarding-completed';

// Custom event name for reopening the modal
export const ONBOARDING_REOPEN_EVENT = 'yseeku-reopen-onboarding';

// Helper function to trigger the onboarding modal from anywhere
export function triggerOnboardingModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ONBOARDING_REOPEN_EVENT));
  }
}

interface OnboardingStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

const platformFeatures: OnboardingStep[] = [
  {
    icon: Shield,
    title: 'Trust Protocol',
    description: 'Cryptographic proof for every AI interaction with constitutional principles',
    color: 'text-purple-500',
  },
  {
    icon: Activity,
    title: 'Live Monitoring',
    description: 'Real-time dashboards tracking trust scores, drift detection, and compliance',
    color: 'text-cyan-500',
  },
  {
    icon: FlaskConical,
    title: 'Research Lab',
    description: 'Experiment with prompts, compare models, and analyze emergence patterns',
    color: 'text-amber-500',
  },
  {
    icon: Building2,
    title: 'Enterprise Governance',
    description: 'Multi-tenant management, audit trails, and compliance reporting',
    color: 'text-emerald-500',
  },
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { enableDemo, isDemo } = useDemo();
  const startTutorial = useTutorialStore(state => state.startTutorial);

  useEffect(() => {
    // Check if user has completed onboarding before
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        // Small delay to let the page load first
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Listen for reopen event
  useEffect(() => {
    const handleReopen = () => {
      setCurrentPage(0);
      setIsOpen(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ONBOARDING_REOPEN_EVENT, handleReopen);
      return () => window.removeEventListener(ONBOARDING_REOPEN_EVENT, handleReopen);
    }
  }, []);

  const handleComplete = (startDemo: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }

    if (startDemo && !isDemo) {
      enableDemo();
    }

    setIsOpen(false);
  };

  const handleStartTutorial = () => {
    handleComplete(true);
    // Small delay to ensure demo mode is enabled first
    setTimeout(() => {
      startTutorial(dashboardTutorialSteps);
    }, 300);
  };

  const handleSkip = () => {
    handleComplete(false);
  };

  const totalPages = 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {currentPage === 0 && (
          <>
            {/* Welcome Page */}
            <div className="relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-emerald-600/20" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">YSEEKU</span>
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  The Enterprise AI Trust Platform
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {platformFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 border text-left hover:border-primary/30 transition-colors"
                      >
                        <Icon className={cn("h-5 w-5 mb-2", feature.color)} />
                        <p className="text-xs font-medium">{feature.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage(1)}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>

                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground mt-4 block w-full"
                >
                  Skip introduction
                </button>
              </div>
            </div>
          </>
        )}

        {currentPage === 1 && (
          <>
            {/* Choose Mode Page */}
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl">How would you like to start?</DialogTitle>
              <DialogDescription>
                Choose the best way to explore the platform
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
              {/* Demo Mode Option - Recommended */}
              <button
                onClick={() => handleComplete(true)}
                className="w-full p-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/30 dark:to-cyan-950/30 hover:border-purple-500/50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
                    <Play className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Demo Mode</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Explore with sample data and pre-configured agents. Perfect for learning the platform.
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Sample AI conversations
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Pre-filled dashboards
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </button>

              {/* Live Mode Option */}
              <button
                onClick={() => handleComplete(false)}
                className="w-full p-4 rounded-xl border border-border hover:border-primary/30 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">Live Mode</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start fresh with real data. Connect your AI agents and begin tracking.
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Real-time monitoring
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Your own agents
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>

              {/* Guided Tour Option */}
              <button
                onClick={handleStartTutorial}
                className="w-full p-3 rounded-lg border border-dashed border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="text-sm font-medium">Take a Guided Tour</span>
                    <p className="text-xs text-muted-foreground">
                      Step-by-step walkthrough of all features
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Page indicator */}
            <div className="flex justify-center gap-1 pb-4">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentPage ? "w-6 bg-purple-500" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
