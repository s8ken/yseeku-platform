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
    id: 'orchestrate-module',
    title: 'Orchestrate — Enterprise Governance',
    content: 'Orchestrate is your control room. Generate GDPR, SOC2, and ISO27001 compliance reports, browse immutable audit trails, and manage multi-tenant fleet access — all in one place.',
    targetId: 'nav-compliance-reports',
    position: 'right',
    path: '/dashboard/reports'
  },
  {
    id: 'system-brain',
    title: 'System Brain — Autonomous Oversight',
    content: 'The Overseer is an autonomous governance loop that monitors trust health across all your agents and can take action when thresholds are breached — in advisory or enforced mode.',
    targetId: 'nav-system-brain',
    position: 'right',
    path: '/dashboard/brain'
  },
  {
    id: 'finish',
    title: 'You\'re all set!',
    content: 'Start exploring! You can restart this tour anytime from the "Platform Tutorial" button in the sidebar.',
    position: 'center',
    path: '/dashboard'
  }
];
