'use client';

import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useTutorialStore, SYMBI_ONBOARDING_STEPS } from '@/store/useTutorialStore';

export function OnboardingButton() {
  const { startTutorial } = useTutorialStore();

  const handleStartOnboarding = () => {
    startTutorial(SYMBI_ONBOARDING_STEPS);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStartOnboarding}
      className="gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      Start Tutorial
    </Button>
  );
}

export function OnboardingWelcomeBanner() {
  const { hasCompletedTutorial, startTutorial } = useTutorialStore();

  if (hasCompletedTutorial) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
            Welcome to SONATE!
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            New to Constitutional AI monitoring? Take our 5-minute guided tour to learn about the SYMBI Framework, Trust Scores, Resonance Metrics, and more.
          </p>
          <Button
            onClick={() => startTutorial(SYMBI_ONBOARDING_STEPS)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Interactive Tour
          </Button>
        </div>
      </div>
    </div>
  );
}
