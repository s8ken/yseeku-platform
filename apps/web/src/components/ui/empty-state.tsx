'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  MessageSquare, 
  AlertTriangle, 
  Lightbulb,
  Activity,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  variant?: 'default' | 'card' | 'inline';
  className?: string;
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = ''
}: EmptyStateProps) => {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            action.variant === 'outline'
              ? 'border border-border hover:bg-muted'
              : action.variant === 'ghost'
              ? 'hover:bg-muted'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="pt-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

// Pre-configured empty states for common dashboard scenarios

export function EmptyTrustReceipts({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      icon={<MessageSquare className="h-12 w-12" />}
      title="No Trust Receipts Yet"
      description="Start a conversation to generate your first trust receipt. Trust receipts are cryptographically verified records of AI interactions."
      action={onStartChat ? {
        label: 'Start Conversation',
        onClick: onStartChat,
      } : undefined}
      variant="card"
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon={<Shield className="h-12 w-12" />}
      title="No Alerts"
      description="Your system is running smoothly. Alerts will appear here when trust violations or anomalies are detected."
      variant="card"
    />
  );
}

export function EmptyInsights({ onViewDocumentation }: { onViewDocumentation?: () => void }) {
  return (
    <EmptyState
      icon={<Lightbulb className="h-12 w-12" />}
      title="No Insights Available"
      description="Insights will be generated after you have trust receipts with sufficient data. They provide actionable recommendations to improve your AI governance."
      action={onViewDocumentation ? {
        label: 'View Documentation',
        onClick: onViewDocumentation,
        variant: 'outline'
      } : undefined}
      variant="card"
    />
  );
}

export function EmptyDashboardBlankSlate({ onStartChat, onViewDemo }: { onStartChat?: () => void; onViewDemo?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Activity className="h-16 w-16 text-muted-foreground mb-6" />
      <h2 className="text-2xl font-bold mb-4">Welcome to YSEEKU</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-lg">
        Your dashboard is ready. Start monitoring AI trust and governance in real-time. 
        Trust receipts, alerts, and insights will appear here as you interact with your AI agents.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onStartChat && (
          <button
            onClick={onStartChat}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Start Your First Conversation
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {onViewDemo && (
          <button
            onClick={onViewDemo}
            className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md font-medium hover:bg-muted transition-colors"
          >
            View Demo Data
            <Activity className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyPhaseShiftData() {
  return (
    <EmptyState
      icon={<Activity className="h-12 w-12" />}
      title="No Phase-Shift Data"
      description="Phase-shift velocity data will appear after multiple interactions with an agent. It tracks behavioral drift over time."
      variant="inline"
      className="py-8"
    />
  );
}

export function EmptyEmergenceData() {
  return (
    <EmptyState
      icon={<Sparkles className="h-12 w-12" />}
      title="No Emergence Patterns Detected"
      description="Linguistic emergence patterns will appear as the agent exhibits consciousness-like behaviors in conversations."
      variant="inline"
      className="py-8"
    />
  );
}

export function EmptyDriftData() {
  return (
    <EmptyState
      icon={<TrendingUp className="h-12 w-12" />}
      title="No Drift Data Available"
      description="Drift detection data requires a baseline of interactions. Start conversations to build behavioral consistency metrics."
      variant="inline"
      className="py-8"
    />
  );
}

export function EmptyInteractionsList() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-12 w-12" />}
      title="No Interactions Yet"
      description="Your conversation history will appear here once you start interacting with AI agents."
      variant="inline"
      className="py-8"
    />
  );
}

export default EmptyState;