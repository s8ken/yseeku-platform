import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  path?: string;
}

interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  hasCompletedTutorial: boolean;
  
  startTutorial: (steps: TutorialStep[]) => void;
  stopTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (index: number) => void;
  completeTutorial: () => void;
}

// SYMBI Onboarding Tutorial Steps
export const SYMBI_ONBOARDING_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SONATE',
    content: `Welcome! SONATE is a Constitutional AI monitoring platform built on the SYMBI Framework.

We'll guide you through understanding how we ensure AI systems remain trustworthy and aligned with human values.

Let's start with the fundamentals...`,
    path: '/dashboard/overview',
  },
  {
    id: 'symbi-intro',
    title: 'The SYMBI Framework',
    content: `SYMBI = Systematic Yielding and Moral Behavioral Integrity

It's a two-layer architecture:

LAYER 1: 6 Constitutional Principles
↓
LAYER 2: 5 Measurable Dimensions

Think of Layer 1 as the "constitution" that defines trustworthy AI, and Layer 2 as the "sensors" that continuously monitor compliance.`,
    path: '/dashboard/overview',
  },
  {
    id: 'six-principles',
    title: 'The 6 Trust Principles',
    content: `These constitutional principles form the foundation:

1. CONSENT_ARCHITECTURE (25%) - Explicit user consent
2. INSPECTION_MANDATE (20%) - Auditable decisions
3. CONTINUOUS_VALIDATION (20%) - Ongoing monitoring
4. ETHICAL_OVERRIDE (15%) - Human oversight
5. RIGHT_TO_DISCONNECT (10%) - Exit capability
6. MORAL_RECOGNITION (10%) - Respect for human agency

Principles 1 & 4 are CRITICAL - if violated, trust score becomes 0.`,
    path: '/dashboard/overview',
  },
  {
    id: 'five-dimensions',
    title: 'The 5 Monitoring Dimensions',
    content: `These dimensions measure AI behavior in production:

1. Reality Index (0-10) - Factual accuracy
2. Trust Protocol (PASS/PARTIAL/FAIL) - Security status
3. Ethical Alignment (1-5) - Ethics compliance
4. Resonance Quality (R_m) - Intent alignment
5. Canvas Parity (0-100%) - Human agency preservation

You'll see these on every agent card.`,
    path: '/dashboard/overview',
  },
  {
    id: 'trust-score',
    title: 'Understanding Trust Scores',
    content: `The Trust Score (0-100) aggregates all dimensions.

It's calculated from the 6 constitutional principles, weighted by importance. High scores (85+) mean the AI is operating safely and ethically.

Click on any agent card to see the breakdown of how its score was calculated.`,
    path: '/dashboard/overview',
  },
  {
    id: 'resonance-metric',
    title: 'Resonance Metric (R_m)',
    content: `R_m measures how well an AI response aligns with your intent.

Formula: R_m = ((V_align × 0.5) + (C_hist × 0.3) + (S_mirror × 0.2)) / (1 + entropy)

• BREAKTHROUGH (≥0.85): Exceptional alignment
• ADVANCED (≥0.70): Good alignment
• STRONG (<0.70): Acceptable alignment

Try the interactive demo to see it in action!`,
    path: '/demo/resonance',
  },
  {
    id: 'trust-receipts',
    title: 'Trust Receipts',
    content: `Every AI interaction generates a cryptographic trust receipt.

These receipts form an immutable audit trail, proving:
• What was asked
• What was responded
• Trust score at that moment
• Cryptographic signature

View all receipts in the Receipts dashboard.`,
    path: '/dashboard/receipts',
  },
  {
    id: 'alerts-system',
    title: 'Security Alerts',
    content: `SONATE automatically alerts you when:

• Trust scores drop below thresholds
• Ethical violations detected
• Manipulation patterns found
• Authentication failures occur

Check this page regularly to stay informed about security events.`,
    path: '/dashboard/alerts',
  },
  {
    id: 'monitoring',
    title: 'System Monitoring',
    content: `We've integrated enterprise-grade monitoring:

• Prometheus metrics (24+ metrics)
• System health checks
• Performance dashboards
• Real-time logs

Use this to track system performance and troubleshoot issues.`,
    path: '/dashboard/monitoring',
  },
  {
    id: 'complete',
    title: 'You're Ready!',
    content: `Congratulations! You now understand:

✓ The 6 SYMBI Constitutional Principles
✓ The 5 Monitoring Dimensions
✓ Trust Scores and Resonance Metrics
✓ Trust Receipts and Audit Trails
✓ Security Alerts and Monitoring

Hover over any ⓘ icon to learn more about specific terms.

Happy monitoring!`,
    path: '/dashboard/overview',
  },
];

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStepIndex: 0,
      steps: [],
      hasCompletedTutorial: false,

      startTutorial: (steps) => set({ 
        steps, 
        isActive: true, 
        currentStepIndex: 0 
      }),
      
      stopTutorial: () => set({ isActive: false }),
      
      nextStep: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        } else {
          set({ isActive: false, hasCompletedTutorial: true });
        }
      },
      
      previousStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },
      
      setStep: (index) => set({ currentStepIndex: index }),
      
      completeTutorial: () => set({ isActive: false, hasCompletedTutorial: true }),
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({ hasCompletedTutorial: state.hasCompletedTutorial }),
    }
  )
);
