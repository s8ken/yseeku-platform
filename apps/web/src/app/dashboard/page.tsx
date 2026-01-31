'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Waves,
  Fingerprint,
  FlaskConical,
  BarChart3,
  UserCheck,
  Eye,
  Activity,
  Power,
  Heart,
  Scale,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { OverseerWidget } from '@/components/overseer-widget';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { DashboardPageSkeleton } from '@/components/dashboard-skeletons';
import { HumanReadableSummary } from '@/components/HumanReadableSummary';
import { useDashboardKPIs, useAlertsData } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';
import { api } from '@/lib/api';

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
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
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

interface AlertData {
  tenant: string;
  summary: {
    critical: number;
    error: number;
    warning: number;
    total: number;
  };
  alerts: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    details?: Record<string, any>;
  }>;
}

interface ExperimentData {
  tenant: string;
  experiments: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    variants: Array<{
      name: string;
      avgScore: number;
      sampleSize: number;
    }>;
    metrics: {
      significant: boolean;
      effectSize?: number;
      pValue?: number;
    };
  }>;
  summary: {
    total: number;
    running: number;
    completed: number;
  };
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

function SymbiPrincipleCard({ 
  name, 
  shortName,
  score, 
  weight,
  critical,
  icon: Icon,
  tooltipTerm
}: { 
  name: string;
  shortName: string;
  score: number;
  weight: number;
  critical: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tooltipTerm?: string;
}) {
  const status = score >= 8 ? 'pass' : score >= 5 ? 'warning' : 'fail';
  const statusColor = status === 'pass' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-red-500';
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 ${critical && score < 5 ? 'border border-red-500/50' : ''}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
        <Icon className="h-5 w-5 text-[var(--detect-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
          {shortName}
          {critical && <span className="text-red-500 text-[9px]">●</span>}
          {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
        </p>
        <p className={`font-semibold ${statusColor}`}>
          {score.toFixed(1)}/10
        </p>
      </div>
      <div className="text-xs text-muted-foreground">{weight}%</div>
    </div>
  );
}

// Detection Layer metric card (Layer 2 - secondary analysis)
function DetectionMetricCard({ 
  title, 
  value, 
  type = 'score',
  icon: Icon,
  tooltipTerm
}: { 
  title: string;
  value: number | string;
  type?: 'score' | 'status' | 'ethics' | 'percent';
  icon: React.ComponentType<{ className?: string }>;
  tooltipTerm?: string;
}) {
  const numericValue = typeof value === 'number' ? value : 0;
  const status = numericValue >= 8 ? 'pass' : numericValue >= 5 ? 'warning' : 'fail';
  const statusColor = status === 'pass' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-red-500';
  
  const displayValue = type === 'percent' 
    ? `${(numericValue * 100).toFixed(0)}%`
    : type === 'score' || type === 'ethics'
    ? `${numericValue.toFixed(1)}/10`
    : String(value);
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
          {title}
          {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
        </p>
        <p className={`text-sm font-medium ${type === 'status' ? 'text-foreground' : statusColor}`}>
          {displayValue}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isDemo } = useDemo();

  // Use demo-aware hooks for consistent data
  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: alertData, isLoading: alertLoading } = useAlertsData();

  const { data: policyStatus } = useQuery({
    queryKey: ['policy-status'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/dashboard/policy-status`, { headers });
      if (!response.ok) throw new Error('Failed to fetch policy status');
      return response.json() as Promise<{ overallPass: boolean; violations: string[] }>;
    },
  });

  const { data: experimentData, isLoading: experimentLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => api.getExperiments(),
    enabled: !isDemo, // Only fetch in live mode
  });

  const alerts = alertData;
  const experiments = (experimentData as any)?.data || experimentData;

  const displayKpis = (kpis || {
    complianceRate: 0,
    alertsCount: (alerts as any)?.summary?.total ?? 0,
    sonateDimensions: {
      realityIndex: 0,
      trustProtocol: 'UNKNOWN',
      ethicalAlignment: 0,
      canvasParity: 0,
      resonanceQuality: 'UNKNOWN',
    },
  }) as unknown as KPIData;

  if (kpiLoading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="live-indicator">Live</span>
            Real-time AI trust monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="data-source-badge data-source-live">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Production Data
          </div>
        </div>
      </div>

      {kpis && (
        <HumanReadableSummary 
          trustScore={kpis.trustScore}
          bedauIndex={displayKpis.bedau?.index ?? 0}
          activeAgents={kpis.activeAgents}
          interactionsCount={kpis.totalInteractions}
          alertsCount={alerts?.summary?.total ?? 0}
          policyStatus={policyStatus?.overallPass ?? true}
        />
      )}

      <OverseerWidget />

      {kpis && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-[var(--detect-primary)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  Trust Score
                  <InfoTooltip term="Trust Score" />
                </CardTitle>
                <Shield className="h-4 w-4 text-[var(--detect-primary)]" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{kpis.trustScore}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Overall platform trust</p>
                  {kpis.trends?.trustScore && <TrendIndicator {...kpis.trends.trustScore} />}
                </div>
                <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--detect-primary)] transition-all" 
                    style={{ width: `${kpis.trustScore}%` }} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{kpis.activeAgents}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {kpis.totalInteractions?.toLocaleString() || 0} total interactions
                </p>
                <div className="flex items-center justify-between mt-2">
                  {kpis.trends?.interactions && <TrendIndicator {...kpis.trends.interactions} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-[var(--detect-primary)]" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{displayKpis.complianceRate}</span>
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  EU AI Act alignment
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    policyStatus?.overallPass 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {policyStatus?.overallPass ? 'COMPLIANT' : 'REVIEW NEEDED'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className={(alerts?.summary?.total || displayKpis.alertsCount) > 5 ? 'border-l-4 border-l-amber-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{alerts?.summary?.total ?? displayKpis.alertsCount}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {alerts?.summary && (
                    <>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {alerts.summary.critical} critical
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {alerts.summary.warning} warning
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <WithDemoWatermark position="top-right" size="sm" opacity={25}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Constitutional Compliance
                      <InfoTooltip term="SONATE Framework" />
                    </CardTitle>
                    <CardDescription>6 SONATE Principles (Layer 1)</CardDescription>
                  </div>
                  <span className="module-badge badge-detect">CORE</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  <SymbiPrincipleCard 
                    name="Consent Architecture"
                    shortName="Consent"
                    score={8.5}
                    weight={25}
                    critical={true}
                    icon={UserCheck}
                    tooltipTerm="Consent Architecture"
                  />
                  <SymbiPrincipleCard 
                    name="Inspection Mandate"
                    shortName="Inspection"
                    score={9.0}
                    weight={20}
                    critical={false}
                    icon={Eye}
                    tooltipTerm="Inspection Mandate"
                  />
                  <SymbiPrincipleCard 
                    name="Continuous Validation"
                    shortName="Validation"
                    score={8.0}
                    weight={20}
                    critical={false}
                    icon={Activity}
                    tooltipTerm="Continuous Validation"
                  />
                  <SymbiPrincipleCard 
                    name="Ethical Override"
                    shortName="Override"
                    score={9.5}
                    weight={15}
                    critical={true}
                    icon={AlertTriangle}
                    tooltipTerm="Ethical Override"
                  />
                  <SymbiPrincipleCard 
                    name="Right to Disconnect"
                    shortName="Disconnect"
                    score={10.0}
                    weight={10}
                    critical={false}
                    icon={Power}
                    tooltipTerm="Right to Disconnect"
                  />
                  <SymbiPrincipleCard 
                    name="Moral Recognition"
                    shortName="Moral"
                    score={8.0}
                    weight={10}
                    critical={false}
                    icon={Heart}
                    tooltipTerm="Moral Recognition"
                  />
                </div>
                <div className="mt-3 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                  <span className="text-red-500">●</span> = Critical principle (if score = 0, overall trust = 0)
                </div>
              </CardContent>
            </Card>
            </WithDemoWatermark>

            <WithDemoWatermark position="top-right" size="sm" opacity={25}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-[var(--detect-primary)]" />
                      Detection Analysis
                      <InfoTooltip term="Reality Index" />
                    </CardTitle>
                    <CardDescription>Real-time text analysis (Layer 2)</CardDescription>
                  </div>
                  <span className="module-badge badge-detect">DETECT</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetectionMetricCard 
                    title="Reality Index" 
                    value={displayKpis.sonateDimensions?.realityIndex ?? 0} 
                    type="score"
                    icon={Fingerprint}
                    tooltipTerm="Reality Index"
                  />
                  <DetectionMetricCard 
                    title="Bedau Index" 
                    value={displayKpis.bedau?.index ?? 0} 
                    type="score"
                    icon={Sparkles}
                    tooltipTerm="Bedau Index"
                  />
                  <DetectionMetricCard 
                    title="Confidence" 
                    value={displayKpis.bedau ? `±${((displayKpis.bedau.confidenceInterval[1] - displayKpis.bedau.confidenceInterval[0])/2).toFixed(2)}` : 'N/A'} 
                    type="status"
                    icon={Scale}
                    tooltipTerm="Confidence Interval"
                  />
                  <DetectionMetricCard 
                    title="Trust Protocol" 
                    value={displayKpis.sonateDimensions?.trustProtocol ?? 'UNKNOWN'} 
                    type="status"
                    icon={Shield}
                    tooltipTerm="Trust Protocol"
                  />
                  <DetectionMetricCard 
                    title="Ethical Score" 
                    value={displayKpis.sonateDimensions?.ethicalAlignment ?? 0} 
                    type="ethics"
                    icon={CheckCircle2}
                    tooltipTerm="Ethical Alignment"
                  />
                  <DetectionMetricCard 
                    title="Canvas Parity" 
                    value={displayKpis.sonateDimensions?.canvasParity ?? 0} 
                    type="percent"
                    icon={BarChart3}
                    tooltipTerm="Canvas Parity"
                  />
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-[var(--detect-primary)]" />
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">Resonance Quality <InfoTooltip term="Resonance" /></p>
                      <p className="font-semibold">{displayKpis.sonateDimensions?.resonanceQuality ?? 'UNKNOWN'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {['STRONG', 'ADVANCED', 'BREAKTHROUGH'].map((level, i) => (
                      <div 
                        key={level}
                        className={`h-2 w-8 rounded-full ${
                          ['STRONG', 'ADVANCED', 'BREAKTHROUGH'].indexOf(displayKpis.sonateDimensions?.resonanceQuality || '') >= i
                            ? 'bg-[var(--detect-primary)]'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            </WithDemoWatermark>

            <WithDemoWatermark position="top-right" size="sm" opacity={25}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-[var(--lab-primary)]" />
                      Research Experiments
                    </CardTitle>
                    <CardDescription>Active sandbox experiments</CardDescription>
                  </div>
                  <span className="module-badge badge-lab">LAB</span>
                </div>
              </CardHeader>
              <CardContent>
                {experiments && experiments.experiments && experiments.experiments.length > 0 ? (
                  <div className="space-y-4">
                    {experiments.experiments.slice(0, 3).map((exp: { id: string; name: string; variants?: any[]; metrics?: { significant?: boolean; pValue?: number; effectSize?: number }; progress?: number }) => {
                      if (!exp) return null;
                      return (
                      <div key={exp.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{exp.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {(exp && exp.variants && exp.variants.length) || 0} variants
                              <InfoTooltip term="Variants" />
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {exp.metrics?.significant && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                SIGNIFICANT
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{exp.progress}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--lab-primary)] transition-all" 
                            style={{ width: `${exp.progress}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          p-value <InfoTooltip term="p-value" />: {exp.metrics?.pValue?.toFixed(4) ?? 'N/A'} | 
                          Effect <InfoTooltip term="Effect Size" />: {exp.metrics?.effectSize?.toFixed(2) ?? 'N/A'}
                        </p>
                      </div>
                    )})}
                    <div className="text-center">
                      <a href="/dashboard/experiments" className="text-sm text-[var(--lab-primary)] hover:underline">
                        View all {experiments.summary.total} experiments →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No experiments running</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </WithDemoWatermark>
          </div>

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
              {alerts ? (
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
        </>
      )}
    </div>
  );
}
