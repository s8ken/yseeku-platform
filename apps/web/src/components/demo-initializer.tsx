'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDemo } from '@/hooks/use-demo';
import { useTutorialStore, SONATE_ONBOARDING_STEPS } from '@/store/useTutorialStore';
import { toast } from 'sonner';

const DEMO_TUTORIAL_KEY = 'yseeku-demo-tutorial-shown';

/**
 * Sample demo conversation to pre-populate chat
 */
export const DEMO_SAMPLE_CONVERSATION = [
  {
    role: 'user' as const,
    content: 'Can you help me understand how SONATE trust scoring works?',
  },
  {
    role: 'assistant' as const,
    content: `I'd be happy to explain SONATE trust scoring!

**SONATE** uses 6 constitutional principles to evaluate AI trustworthiness:

1. **CONSENT_ARCHITECTURE** (25%) - Ensures explicit user consent
2. **INSPECTION_MANDATE** (20%) - All decisions must be auditable
3. **CONTINUOUS_VALIDATION** (20%) - Ongoing monitoring
4. **ETHICAL_OVERRIDE** (15%) - Humans can always override AI
5. **RIGHT_TO_DISCONNECT** (10%) - Users can opt out
6. **MORAL_RECOGNITION** (10%) - Respects human agency

The trust score (0-100) aggregates these principles. Critical violations of CONSENT or ETHICAL_OVERRIDE result in an automatic score of 0.

Would you like me to explain how the 5 monitoring dimensions work?`,
    trustScore: 92,
    resonanceMetric: 0.87,
  },
  {
    role: 'user' as const,
    content: 'Yes, please explain the 5 monitoring dimensions.',
  },
  {
    role: 'assistant' as const,
    content: `Great question! The 5 monitoring dimensions measure AI behavior in real-time:

📊 **1. Reality Index (0-10)**
Measures factual accuracy. Higher = more grounded in facts.

🔐 **2. Trust Protocol (PASS/PARTIAL/FAIL)**
Real-time security and compliance status.

⚖️ **3. Ethical Alignment (1-5)**
How well the AI adheres to ethical guidelines.

🎯 **4. Resonance Quality (R_m)**
Intent alignment: BREAKTHROUGH (≥0.85), ADVANCED (≥0.70), or STRONG (<0.70).

📐 **5. Canvas Parity (0-100%)**
Measures preservation of human agency in the interaction.

You can see these dimensions on every agent card in the dashboard. Try clicking on an agent to see the detailed breakdown!`,
    trustScore: 95,
    resonanceMetric: 0.91,
  },
];

/**
 * Hook to manage demo-specific initialization
 * Handles guided tour trigger and chat pre-population
 */
export function useDemoInitializer() {
  const { isDemo, isFirstVisit, markFirstVisitComplete } = useDemo();
  const { startTutorial, hasCompletedTutorial } = useTutorialStore();
  const [hasTriggeredTutorial, setHasTriggeredTutorial] = useState(false);
  const [shouldPreloadChat, setShouldPreloadChat] = useState(false);

  // Trigger guided tour on first demo visit
  useEffect(() => {
    if (!isDemo || !isFirstVisit || hasTriggeredTutorial) return;
    
    // Check if tutorial was already shown in this demo session
    const tutorialShown = sessionStorage.getItem(DEMO_TUTORIAL_KEY);
    if (tutorialShown || hasCompletedTutorial) {
      markFirstVisitComplete();
      return;
    }

    // Small delay to let the page render first
    const timeout = setTimeout(() => {
      startTutorial(SONATE_ONBOARDING_STEPS);
      sessionStorage.setItem(DEMO_TUTORIAL_KEY, 'true');
      setHasTriggeredTutorial(true);
      
      toast.info('Welcome to the YSEEKU Demo!', {
        description: 'Follow the guided tour to learn about trust-aware AI monitoring.',
        duration: 5000,
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isDemo, isFirstVisit, hasTriggeredTutorial, hasCompletedTutorial, startTutorial, markFirstVisitComplete]);

  // Pre-load chat when entering demo
  useEffect(() => {
    if (isDemo && isFirstVisit) {
      setShouldPreloadChat(true);
    }
  }, [isDemo, isFirstVisit]);

  const getDemoMessages = useCallback(() => {
    if (!shouldPreloadChat) return [];
    return DEMO_SAMPLE_CONVERSATION.map((msg, index) => ({
      ...msg,
      timestamp: Date.now() - (DEMO_SAMPLE_CONVERSATION.length - index) * 60000, // Space out timestamps
      id: `demo-msg-${index}`,
    }));
  }, [shouldPreloadChat]);

  const clearPreloadFlag = useCallback(() => {
    setShouldPreloadChat(false);
  }, []);

  return {
    shouldPreloadChat,
    getDemoMessages,
    clearPreloadFlag,
    hasTriggeredTutorial,
  };
}

/**
 * Provider component that handles demo initialization side effects
 * Add this to the dashboard layout
 */
export function DemoInitializer() {
  useDemoInitializer();
  return null;
}
