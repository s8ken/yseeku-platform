import { TutorialStep } from '@/store/useTutorialStore';

export const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SONATE',
    content: 'Welcome to the SONATE AI Trust Platform. This quick tour covers the essentials — you can explore deeper features at your own pace.',
    position: 'center',
    path: '/dashboard'
  },
  {
    id: 'trust-score',
    title: 'Trust Score',
    content: 'The Trust Score (0–100) tells you how much you can rely on your AI agents. It combines safety, honesty, and constitutional alignment into a single number.',
    targetId: 'dashboard-trust-score',
    position: 'bottom',
    path: '/dashboard'
  },
  {
    id: 'detect-module',
    title: 'Detect — Live Monitoring',
    content: 'The Detect module monitors your AI in real-time. Track agent trust, spot anomalies via drift detection, and receive instant alerts on safety violations.',
    targetId: 'nav-dashboard',
    position: 'right',
    path: '/dashboard'
  },
  {
    id: 'lab-module',
    title: 'Lab — Research Sandbox',
    content: 'The Lab is your safe space to experiment. Test prompts, compare models, and analyze emergence patterns — all before anything touches production.',
    targetId: 'nav-experiments',
    position: 'right',
    path: '/dashboard/lab/experiments'
  },
  {
    id: 'finish',
    title: 'You\'re all set!',
    content: 'Start exploring! You can restart this tour anytime from the "Platform Tutorial" button in the sidebar.',
    position: 'center',
    path: '/dashboard'
  }
];
