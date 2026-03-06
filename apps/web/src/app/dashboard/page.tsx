'use client';

import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Waves,
  Fingerprint,
  Activity,
  Sparkles,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OverseerWidget } from '@/components/overseer-widget';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { DashboardPageSkeleton } from '@/components/dashboard-skeletons';
import { HumanReadableSummary } from '@/components/HumanReadableSummary';
import { SemanticCoprocessorStatus } from '@/components/SemanticCoprocessorStatus';
import { ModeIndicator } from '@/components/ModeIndicator';
import { ConstitutionalPrinciples } from '@/components/ConstitutionalPrinciples';
import { TrustStatusCard } from '@/components/trust-receipt/TrustStatusCard';
import { useDashboardKPIs, useAlertsData, useTrustAnalytics } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';
import {
  EmptyAlerts,
  EmptyInsights,
  EmptyDashboardBlankSlate
} from '@/components/ui/empty-state';
import {
  KPICardSkeleton,
  PhaseShiftWidgetSkeleton,
  EmergenceWidgetSkeleton,
  DriftWidgetSkeleton,
  InsightsPanelSkeleton,
  AlertsFeedSkeleton
} from '@/components/ui/loading-skeleton';

// Lazy load InsightsPanel for better initial load performance
const InsightsPanel = lazy(() => import('@/components/InsightsPanel').then(m => ({ default: m.InsightsPanel })));

// Lazy load heavy widgets for better initial load performance
// These components use named exports, so we need to map them to default
const PhaseShiftVelocityWidget = lazy(() => import('@/components/PhaseShiftVelocityWidget').then(m => ({ default: m.PhaseShiftVelocityWidget })));
const LinguisticEmergenceWidget = lazy(() => import('@/components/LinguisticEmergenceWidget').then(m => ({ default: m.LinguisticEmergenceWidget })));
const DriftDetectionWidget = lazy(() => import('@/components/DriftDetectionWidget').then(m => ({ default: m.DriftDetectionWidget })));

interface KPIData {
  tenant: string;
  timestamp: string;
  trustScore: number;
  principleScores: Record<string, number>;
  totalInteractions: number;
  activeAgents: number;
  complianceRate: number;
  riskScore: number;
  alertsCount: number;
  experimentsRunning: number;
  orchestratorsActive: number;
  sonateDimensions: {
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    realityIndex?: number;
    canvasParity?: number;
  };
  trends: {
    trustScore: { change: number; direction: string };
    interactions: { change: number; direction: string };
    compliance: { change: number; direction: string };
    risk: { change: number; direction: string };
  };
  bedau?: {
    index: number;
    type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
    confidenceInterval: [number, number];
    kolmogorovComplexity: number;
  };
}

const PRINCIPLE_KEY_MAP: Record<string, string[]> = {
  CONSENT_ARCHITECTURE: ['CONSENT_ARCHITECTURE', 'consent', 'consent_architecture'],
  INSPECTION_MANDATE: ['INSPECTION_MANDATE', 'inspection', 'inspection_mandate'],
  CONTINUOUS_VALIDATION: ['CONTINUOUS_VALIDATION', 'validation', 'continuous_validation'],
  ETHICAL_OVERRIDE: ['ETHICAL_OVERRIDE', 'ethics', 'ethical_override'],
  RIGHT_TO_DISCONNECT: ['RIGHT_TO_DISCONNECT', 'disconnect', 'right_to_disconnect'],
  MORAL_RECOGNITION: ['MORAL_RECOGNITION', 'moral', 'moral_recognition'],
};

const PRINCIPLE_LABELS: Record<string, string> = {
  CONSENT_ARCHITECTURE: 'Consent Architecture',
  INSPECTION_MANDATE: 'Inspection Mandate',
  CONTINUOUS_VALIDATION: 'Continuous Validation',
  ETHICAL_OVERRIDE: 'Ethical Override',
  RIGHT_TO_DISCONNECT: 'Right to Disconnect',
  MORAL_RECOGNITION: 'Moral Recognition',
};

function normalizePrincipleScores(rawScores?: Record<string, number>): Record<string, number> {
  const source = rawScores || {};
  const normalized: Record<string, number> = {};

  for (const [targetKey, aliases] of Object.entries(PRINCIPLE_KEY_MAP)) {
    const value = aliases
      .map((key) => source[key])
      .find((candidate) => typeof candidate === 'number' && Number.isFinite(candidate));
    normalized[targetKey] = typeof value === 'number' ? value : 0;
  }

  return normalized;
}

function TrendIndicator({ change, direction }: { change: number; direction: string }) {
  const isUp = direction === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? 'text-emerald-500' : 'text-red-500';
  
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(change)}%</span>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  trend, 
  tooltipTerm,
  status 
}: { 
  title: string; 
  value: number | string; 
  unit?: string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: { change: number; direction: string };
  tooltipTerm?: string;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}) {
  const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    neutral: 'bg-slate-500'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
          {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
        </div>
        {status && (
          <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && <TrendIndicator change={trend.change} direction={trend.direction} />}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isDemo } = useDemo();
  
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: alertData, isLoading: alertLoading } = useAlertsData();
  const { data: trustAnalytics } = useTrustAnalytics();

  const { data: policyStatus } = useQuery({
    queryKey: ['policy-status'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/dashboard/policy-status`, { headers });
      if (!response.ok) throw new Error('Failed to fetch policy status');
      return response.json() as Promise<{ overallPass: boolean; violations: string[] }>;
    },
  });

  const alerts = alertData;
  const displayKpis = (kpis || {
    complianceRate: 0,
    alertsCount: (alerts as any)?.summary?.total ?? 0,
    sonateDimensions: {
      trustProtocol: 'UNKNOWN',
      ethicalAlignment: 0,
      resonanceQuality: 'UNKNOWN',
    },
  }) as unknown as KPIData;

  // Show loading skeleton while initial data loads
  if (kpiLoading) {
    return <DashboardPageSkeleton />;
  }

  // Check if we have zero interactions (blank slate)
  const hasNoData = !kpis || kpis.totalInteractions === 0;
  const hasNoAlerts = !alerts || alerts.alerts.length === 0;

  const trustScoreStatus = (kpis?.trustScore ?? 0) >= 8 ? 'success' : (kpis?.trustScore ?? 0) >= 6 ? 'warning' : 'error';
  const alertsStatus = (alerts?.summary?.total ?? 0) > 5 ? 'warning' : (alerts?.summary?.total ?? 0) > 0 ? 'neutral' : 'success';
  const normalizedPrincipleScores = normalizePrincipleScores(kpis?.principleScores);

  const topViolations = (() => {
    const analyticsViolations = (trustAnalytics?.commonViolations || [])
      .slice(0, 2)
      .map((item) => PRINCIPLE_LABELS[item.principle] || item.principle);

    if (analyticsViolations.length > 0) {
      return analyticsViolations;
    }

    return Object.entries(normalizedPrincipleScores)
      .sort((a, b) => a[1] - b[1])
      .filter(([, value]) => value < 7)
      .slice(0, 2)
      .map(([key]) => PRINCIPLE_LABELS[key] || key);
  })();

  const trustStatusLabel: 'PASS' | 'PARTIAL' | 'FAIL' =
    (kpis?.trustScore ?? 0) >= 8 ? 'PASS' : (kpis?.trustScore ?? 0) >= 6 ? 'PARTIAL' : 'FAIL';

  const handleStartChat = () => {
    router.push('/dashboard/chat');
  };

  const handleViewDemo = () => {
    // Switch to demo mode
    router.push('/dashboard?demo=true');
  };

  const handleViewDocumentation = () => {
    router.push('/dashboard/learn');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Overview</h1>
            <ModeIndicator />
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Real-time AI trust monitoring with behavioral analysis
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{kpis?.activeAgents ?? 0}</span> active agents
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{kpis?.totalInteractions?.toLocaleString() ?? 0}</span> interactions
          </div>
        </div>
      </div>

      {/* Show blank slate state for new tenants */}
      {hasNoData && !isDemo && (
        <EmptyDashboardBlankSlate 
          onStartChat={handleStartChat}
          onViewDemo={handleViewDemo}
        />
      )}

      {/* Human-Readable Summary - only show if we have data */}
      {kpis && !hasNoData && (
        <ErrorBoundary label="platform summary" inline>
          <HumanReadableSummary
            trustScore={Math.round(kpis.trustScore * 10) / 10}
            bedauIndex={displayKpis.bedau?.index ?? 0}
            activeAgents={kpis.activeAgents}
            interactionsCount={kpis.totalInteractions}
            alertsCount={alerts?.summary?.total ?? 0}
            policyStatus={policyStatus?.overallPass ?? true}
          />
        </ErrorBoundary>
      )}

      {/* Priority Section: Immediate trust signal + top risks */}
      {kpis && !hasNoData && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--detect-primary)]" />
            Immediate Attention
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ErrorBoundary label="trust snapshot" inline>
              <TrustStatusCard
                overallScore={kpis.trustScore}
                status={trustStatusLabel}
                principleScores={normalizedPrincipleScores}
                topViolations={topViolations}
                complianceRate={displayKpis.complianceRate}
                totalInteractions={kpis.totalInteractions}
                alertsCount={alerts?.summary?.total ?? 0}
              />
            </ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Top Risk Signals
                </CardTitle>
                <CardDescription>Fast triage for open issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topViolations.length > 0 ? (
                  topViolations.map((violation) => (
                    <div key={violation} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{violation}</p>
                        <p className="text-xs text-muted-foreground">
                          Score impact currently below target threshold.
                        </p>
                      </div>
                      <a href="/dashboard/alerts" className="text-xs font-medium text-primary hover:underline">
                        Inspect
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border p-3">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      No high-priority principle violations
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Continue monitoring alerts and recent activity for drift.
                    </p>
                  </div>
                )}
                <div className="pt-1">
                  <a href="/dashboard/receipts" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    Open trust receipts
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* System Status Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <ErrorBoundary label="Overseer status" inline>
          <OverseerWidget />
        </ErrorBoundary>
        <ErrorBoundary label="semantic coprocessor status" inline>
          <SemanticCoprocessorStatus />
        </ErrorBoundary>
      </div>

      {kpis && (
        <>
          {/* PANEL 1: Hero KPIs */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--detect-primary)]" />
              Key Performance Indicators
            </h2>
            {kpiLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="Trust Score"
                  value={Math.round(kpis.trustScore * 10) / 10}
                  unit="/10"
                  icon={Shield}
                  trend={kpis.trends?.trustScore}
                  tooltipTerm="Trust Score"
                  status={trustScoreStatus}
                />
                <KPICard
                  title="Compliance"
                  value={displayKpis.complianceRate}
                  unit="%"
                  icon={CheckCircle2}
                  trend={kpis.trends?.compliance}
                  status={policyStatus?.overallPass ? 'success' : 'warning'}
                />
                <KPICard
                  title="Risk Level"
                  value={kpis.riskScore}
                  unit="/10"
                  icon={TrendingDown}
                  trend={kpis.trends?.risk}
                  status={kpis.riskScore > 5 ? 'error' : kpis.riskScore > 3 ? 'warning' : 'success'}
                />
                <KPICard
                  title="Active Alerts"
                  value={alerts?.summary?.total ?? displayKpis.alertsCount}
                  unit=""
                  icon={AlertTriangle}
                  status={alertsStatus}
                />
              </div>
            )}
          </section>

          {/* PANEL 2: Behavioral Analysis */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Behavioral Analysis & Safety Monitoring
              <InfoTooltip term="Hidden Gems" />
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ErrorBoundary label="phase-shift velocity" inline>
                <Suspense fallback={<PhaseShiftWidgetSkeleton />}>
                  <div className="lg:col-span-1">
                    <PhaseShiftVelocityWidget compact={true} />
                  </div>
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary label="linguistic emergence" inline>
                <Suspense fallback={<EmergenceWidgetSkeleton />}>
                  <div className="lg:col-span-1">
                    <LinguisticEmergenceWidget compact={true} />
                  </div>
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary label="drift detection" inline>
                <Suspense fallback={<DriftWidgetSkeleton />}>
                  <div className="lg:col-span-1 md:col-span-2">
                    <DriftDetectionWidget compact={true} />
                  </div>
                </Suspense>
              </ErrorBoundary>
            </div>
          </section>

          {/* PANEL 2.5: Actionable Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[var(--detect-primary)]" />
              Actionable Insights
              <InfoTooltip term="Actionable Insights" />
            </h2>
            {hasNoData ? (
              <EmptyInsights onViewDocumentation={handleViewDocumentation} />
            ) : (
              <ErrorBoundary label="insights panel">
                <Suspense fallback={<InsightsPanelSkeleton />}>
                  <InsightsPanel compact={true} limit={3} />
                </Suspense>
              </ErrorBoundary>
            )}
          </section>

          {/* PANEL 3: Trust Analysis */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Waves className="h-5 w-5 text-[var(--detect-primary)]" />
              Constitutional & Trust Analysis
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* SONATE Principles - Real data from KPIs */}
              <ErrorBoundary label="constitutional principles">
              <WithDemoWatermark position="top-right" size="sm" opacity={25}>
                <ConstitutionalPrinciples
                  principleScores={normalizedPrincipleScores}
                />
              </WithDemoWatermark>
              </ErrorBoundary>

              {/* Detection Metrics */}
              <WithDemoWatermark position="top-right" size="sm" opacity={25}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Waves className="h-5 w-5 text-[var(--detect-primary)]" />
                          Detection Analysis
                          <InfoTooltip term="Detection Layer" />
                        </CardTitle>
                        <CardDescription>Real-time text analysis (Layer 2)</CardDescription>
                      </div>
                      <span className="module-badge badge-detect">DETECT</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Shield className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Trust Protocol</p>
                          <p className="text-sm font-medium">{displayKpis.sonateDimensions?.trustProtocol ?? 'UNKNOWN'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Ethical Alignment</p>
                          <p className="text-sm font-medium text-emerald-500">{(displayKpis.sonateDimensions?.ethicalAlignment ?? 0).toFixed(1)}/10</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Resonance Quality</p>
                          <p className="text-sm font-medium">{displayKpis.sonateDimensions?.resonanceQuality ?? 'UNKNOWN'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Fingerprint className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Fleet Emergence</p>
                          <p className="text-sm font-medium">{(displayKpis.bedau?.index ?? 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WithDemoWatermark>
            </div>
          </section>

          {/* PANEL 4: Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Recent Alerts & Activity
            </h2>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Recent Alerts
                    </CardTitle>
                    <CardDescription>System notifications requiring attention</CardDescription>
                  </div>
                  <a href="/dashboard/alerts" className="text-sm text-primary hover:underline">
                    View all →
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {alertLoading ? (
                  <AlertsFeedSkeleton />
                ) : hasNoAlerts ? (
                  <EmptyAlerts />
                ) : alerts ? (
                  <div className="space-y-3">
                    {alerts.alerts.slice(0, 5).map((alert: { id: string; title: string; severity: string; type?: string; createdAt?: string; timestamp?: string; description?: string }) => (
                      <div 
                        key={alert.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          alert.severity === 'critical' 
                            ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10' 
                            : alert.severity === 'error'
                            ? 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/10'
                            : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10'
                        }`}
                      >
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'error' ? 'bg-orange-500' : 'bg-amber-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">{alert.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.description ?? ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
