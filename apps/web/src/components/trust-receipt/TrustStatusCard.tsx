import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TrustStatus = 'PASS' | 'PARTIAL' | 'FAIL';

const PRINCIPLE_LABELS: Record<string, string> = {
  CONSENT_ARCHITECTURE: 'Consent Architecture',
  INSPECTION_MANDATE: 'Inspection Mandate',
  CONTINUOUS_VALIDATION: 'Continuous Validation',
  ETHICAL_OVERRIDE: 'Ethical Override',
  RIGHT_TO_DISCONNECT: 'Right to Disconnect',
  MORAL_RECOGNITION: 'Moral Recognition',
};

function statusStyle(status: TrustStatus): string {
  if (status === 'PASS') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'PARTIAL') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}

function scoreStyle(score: number): string {
  if (score >= 8) return 'text-emerald-500';
  if (score >= 6) return 'text-amber-500';
  return 'text-red-500';
}

interface TrustStatusCardProps {
  overallScore: number;
  status: TrustStatus;
  principleScores: Record<string, number>;
  topViolations: string[];
  complianceRate: number;
  totalInteractions: number;
  alertsCount: number;
}

export function TrustStatusCard({
  overallScore,
  status,
  principleScores,
  topViolations,
  complianceRate,
  totalInteractions,
  alertsCount,
}: TrustStatusCardProps) {
  const strongestPrinciples = Object.entries(principleScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key, value]) => `${PRINCIPLE_LABELS[key] || key}: ${value.toFixed(1)}/10`);

  const lowestPrinciples = Object.entries(principleScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([key, value]) => ({
      label: PRINCIPLE_LABELS[key] || key,
      value,
    }));

  return (
    <Card className="border-l-4 border-l-[var(--detect-primary)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--detect-primary)]" />
              Trust Snapshot
            </CardTitle>
            <CardDescription>Constitutional status in one view</CardDescription>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(status)}`}>
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Trust</p>
            <p className={`text-4xl font-bold ${scoreStyle(overallScore)}`}>{overallScore.toFixed(1)}/10</p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <p>{totalInteractions.toLocaleString()} interactions</p>
            <p>{complianceRate ?? 0}% compliance</p>
            <p>{alertsCount} active alerts</p>
          </div>
        </div>

        <div className="rounded-lg border p-3 bg-muted/20">
          <p className="text-xs font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Why this score?
          </p>
          <ul className="space-y-1.5 text-sm">
            <li>Score is weighted across all 6 SONATE principles for this tenant.</li>
            <li>
              Strongest signals:{' '}
              {strongestPrinciples.length > 0 ? strongestPrinciples.join(' | ') : 'No principle data yet.'}
            </li>
            <li>
              {topViolations.length > 0
                ? `Top violations: ${topViolations.join(' • ')}`
                : 'No high-priority violations detected right now.'}
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {lowestPrinciples.map((item) => (
            <div key={item.label} className="rounded-md border p-2">
              <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
              <p className={`text-sm font-semibold ${scoreStyle(item.value)}`}>{item.value.toFixed(1)}/10</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/receipts">
              View Receipts
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/alerts">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Review Alerts
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

