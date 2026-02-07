import { TutorialStep } from '@/store/useTutorialStore';

export const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SONATE',
    content: 'Welcome to the SONATE AI Trust Platform. This tutorial will guide you through our main features and explain the key terms we use to measure AI trust.',
    position: 'center',
    path: '/dashboard'
  },
  {
    id: 'trust-score',
    title: 'Trust Score',
    content: 'The Trust Score is a simple 0-100 rating that tells you how much you can rely on your AI agents. It combines safety, honesty, and alignment with your rules.',
    targetId: 'dashboard-trust-score',
    position: 'bottom',
    path: '/dashboard'
  },
  {
    id: 'compliance',
    title: 'Compliance Rate',
    content: 'This shows how well your AI systems follow regulations like the EU AI Act. We automatically check if your AI is meeting legal and safety standards.',
    targetId: 'dashboard-compliance-rate',
    position: 'bottom',
    path: '/dashboard'
  },
  {
    id: 'detect-module',
    title: 'Detect Module',
    content: 'The Detect section is for monitoring your AI in real-time. \n\n• Agent Trust: Deep dive into individual agent performance.\n• Risk Monitor: Spot unusual behavior or "drift" early.\n• Alerts: Immediate notification of safety violations.',
    targetId: 'nav-dashboard',
    position: 'right',
    path: '/dashboard'
  },
  {
    id: 'lab-module',
    title: 'Lab Module',
    content: 'The Lab is your research playground. Here you can run experiments and test new AI models before they go live.',
    targetId: 'nav-experiments',
    position: 'right',
    path: '/dashboard/lab/experiments'
  },
  {
    id: 'safety-scanner',
    title: 'Safety Scanner',
    content: 'The Safety Scanner helps you test AI prompts and responses for potential risks before deployment. It checks for harmful content, bias, and compliance issues.',
    targetId: 'nav-safety-scanner',
    position: 'right',
    path: '/dashboard/safety'
  },
  {
    id: 'orchestrate-module',
    title: 'Orchestrate Module',
    content: 'This is the control center for your entire organization. Manage users, view detailed logs, and access our cryptographic "Trust Receipts".',
    targetId: 'nav-tenants',
    position: 'right',
    path: '/dashboard/tenants'
  },
  {
    id: 'trust-receipts',
    title: 'Trust Receipts',
    content: 'A Trust Receipt is a digital "proof of interaction." Think of it like a blockchain receipt that proves exactly what the AI said and why it was deemed safe at that specific moment.',
    targetId: 'nav-trust-receipts',
    position: 'right',
    path: '/dashboard/receipts'
  },
  {
    id: 'documentation',
    title: 'Need more help?',
    content: 'Our documentation hub contains a full glossary and detailed guides on every technical term used in the platform.',
    targetId: 'nav-documentation',
    position: 'right',
    path: '/dashboard/docs'
  },
  {
    id: 'finish',
    title: 'Ready to go!',
    content: 'You\'re all set! You can restart this tutorial anytime by clicking the Help button in the sidebar. Happy monitoring!',
    position: 'center',
    path: '/dashboard'
  }
];
