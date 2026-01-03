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
