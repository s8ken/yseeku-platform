'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  MessageSquare, 
  Lightbulb,
  Activity,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2
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
          type="button"
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

type DashboardRole = 'admin' | 'user' | 'viewer';

function getRoleOnboarding(role: DashboardRole) {
  if (role === 'admin') {
    return {
      title: 'Set Your Governance Baseline',
      description:
        'Configure trust policy, alert thresholds, and tenant controls before onboarding your team.',
      checklist: [
        'Review trust policy and principle weighting',
        'Configure alert routing and escalation',
        'Verify tenant and role permissions',
      ],
      primaryLabel: 'Configure Governance',
      storageKey: 'admin-baseline',
    };
  }

  if (role === 'viewer') {
    return {
      title: 'Start With Verification',
      description:
        'You can inspect trust posture and verify receipts without changing system configuration.',
      checklist: [
        'Verify a trust receipt signature',
        'Review active alerts and risk signals',
        'Open trust analytics for trends',
      ],
      primaryLabel: 'Verify First Receipt',
      storageKey: 'viewer-verification',
    };
  }

  return {
    title: 'Start Your First Trust Session',
    description:
      'Create your first interaction to generate trust receipts, principle scores, and governance insights.',
      checklist: [
        'Start a trust session with an agent',
        'Review the generated trust receipt',
        'Check alerts and recommendations',
      ],
      primaryLabel: 'Start Trust Session',
      storageKey: 'user-first-session',
  };
}

export function EmptyDashboardBlankSlate({
  onStartChat,
  onViewDemo,
  onPrimaryAction,
  role = 'user',
  primaryActionLabel,
}: {
  onStartChat?: () => void;
  onViewDemo?: () => void;
  onPrimaryAction?: () => void;
  role?: DashboardRole;
  primaryActionLabel?: string;
}) {
  const onboarding = getRoleOnboarding(role);
  const primaryAction = onPrimaryAction ?? onStartChat;
  const primaryLabel = primaryActionLabel ?? onboarding.primaryLabel;
  const checklistStorageKey = useMemo(
    () => `yseeku-dashboard-onboarding-${onboarding.storageKey}`,
    [onboarding.storageKey],
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const persisted = window.localStorage.getItem(checklistStorageKey);
      if (!persisted) {
        setCompletedSteps([]);
        return;
      }

      const parsed = JSON.parse(persisted) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'number')) {
        setCompletedSteps(parsed);
        return;
      }
      setCompletedSteps([]);
    } catch {
      setCompletedSteps([]);
    }
  }, [checklistStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(checklistStorageKey, JSON.stringify(completedSteps));
  }, [checklistStorageKey, completedSteps]);

  const toggleChecklistStep = (index: number): void => {
    setCompletedSteps((current) => {
      if (current.includes(index)) {
        return current.filter((stepIndex) => stepIndex !== index);
      }
      return [...current, index];
    });
  };

  const completedCount = completedSteps.length;
  const completionPercent = Math.round((completedCount / onboarding.checklist.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Activity className="h-16 w-16 text-muted-foreground mb-6" />
      <h2 className="text-2xl font-bold mb-4">Welcome to YSEEKU</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-lg">
        {onboarding.description}
      </p>
      <div className="w-full max-w-xl rounded-lg border p-4 mb-6 bg-muted/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{onboarding.title}</p>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{onboarding.checklist.length} complete
          </p>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${completionPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {onboarding.checklist.map((item, index) => {
            const isComplete = completedSteps.includes(index);
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={isComplete}
                  onClick={() => toggleChecklistStep(index)}
                  className="flex w-full items-start gap-2 rounded-md p-1 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      isComplete ? "text-emerald-500" : "text-muted-foreground/60",
                    )}
                  />
                  <span className={cn(isComplete && "text-muted-foreground line-through")}>
                    {item}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {onViewDemo && (
          <button
            type="button"
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
