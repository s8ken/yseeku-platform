import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LearningProgress {
  moduleId: string;
  pathId: string;
  completedSteps: string[];
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

interface LearningStore {
  // Progress tracking
  progress: Record<string, LearningProgress>;
  
  // Actions
  startModule: (pathId: string, moduleId: string) => void;
  completeStep: (pathId: string, moduleId: string, stepId: string) => void;
  completeModule: (pathId: string, moduleId: string) => void;
  resetProgress: (pathId?: string, moduleId?: string) => void;
  
  // Getters
  getModuleProgress: (pathId: string, moduleId: string) => LearningProgress | undefined;
  getPathProgress: (pathId: string) => number;
  isModuleCompleted: (pathId: string, moduleId: string) => boolean;
  isStepCompleted: (pathId: string, moduleId: string, stepId: string) => boolean;
  getTotalCompletedModules: () => number;
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      progress: {},

      startModule: (pathId, moduleId) => {
        const key = `${pathId}:${moduleId}`;
        const existing = get().progress[key];
        
        if (!existing) {
          set((state) => ({
            progress: {
              ...state.progress,
              [key]: {
                moduleId,
                pathId,
                completedSteps: [],
                startedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
              },
            },
          }));
        } else {
          set((state) => ({
            progress: {
              ...state.progress,
              [key]: {
                ...existing,
                lastAccessedAt: new Date().toISOString(),
              },
            },
          }));
        }
      },

      completeStep: (pathId, moduleId, stepId) => {
        const key = `${pathId}:${moduleId}`;
        const existing = get().progress[key];
        
        if (existing && !existing.completedSteps.includes(stepId)) {
          set((state) => ({
            progress: {
              ...state.progress,
              [key]: {
                ...existing,
                completedSteps: [...existing.completedSteps, stepId],
                lastAccessedAt: new Date().toISOString(),
              },
            },
          }));
        }
      },

      completeModule: (pathId, moduleId) => {
        const key = `${pathId}:${moduleId}`;
        const existing = get().progress[key];
        
        if (existing) {
          set((state) => ({
            progress: {
              ...state.progress,
              [key]: {
                ...existing,
                completedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
              },
            },
          }));
        }
      },

      resetProgress: (pathId, moduleId) => {
        if (pathId && moduleId) {
          const key = `${pathId}:${moduleId}`;
          set((state) => {
            const { [key]: _, ...rest } = state.progress;
            return { progress: rest };
          });
        } else if (pathId) {
          set((state) => {
            const filtered = Object.fromEntries(
              Object.entries(state.progress).filter(([key]) => !key.startsWith(`${pathId}:`))
            );
            return { progress: filtered };
          });
        } else {
          set({ progress: {} });
        }
      },

      getModuleProgress: (pathId, moduleId) => {
        const key = `${pathId}:${moduleId}`;
        return get().progress[key];
      },

      getPathProgress: (pathId) => {
        const allProgress = get().progress;
        const pathModules = Object.entries(allProgress)
          .filter(([key]) => key.startsWith(`${pathId}:`))
          .map(([, value]) => value);
        
        if (pathModules.length === 0) return 0;
        
        const completedCount = pathModules.filter((m) => m.completedAt).length;
        return Math.round((completedCount / pathModules.length) * 100);
      },

      isModuleCompleted: (pathId, moduleId) => {
        const key = `${pathId}:${moduleId}`;
        return !!get().progress[key]?.completedAt;
      },

      isStepCompleted: (pathId, moduleId, stepId) => {
        const key = `${pathId}:${moduleId}`;
        return get().progress[key]?.completedSteps.includes(stepId) ?? false;
      },

      getTotalCompletedModules: () => {
        return Object.values(get().progress).filter((m) => m.completedAt).length;
      },
    }),
    {
      name: 'yseeku-learning-progress',
    }
  )
);

// Learning path definitions for reference
export const LEARNING_PATHS = {
  foundations: {
    id: 'foundations',
    title: 'Platform Foundations',
    modules: ['what-is-sonate', 'trust-score-explained', 'your-first-dashboard', 'reading-trust-receipts'],
  },
  constitutional: {
    id: 'constitutional',
    title: 'Constitutional AI Principles',
    modules: ['consent-architecture', 'inspection-mandate', 'continuous-validation', 'ethical-override', 'right-to-disconnect', 'moral-recognition'],
  },
  detection: {
    id: 'detection',
    title: 'AI Detection & Monitoring',
    modules: ['five-dimensions', 'reality-index-deep', 'drift-detection', 'alerts-setup'],
  },
  emergence: {
    id: 'emergence',
    title: 'Understanding Emergence',
    modules: ['what-is-emergence', 'bedau-index', 'emergence-lab'],
  },
  overseer: {
    id: 'overseer',
    title: 'The Autonomous Overseer',
    modules: ['overseer-intro', 'sense-plan-act', 'configuring-overseer'],
  },
};
