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
import { api } from '@/lib/api';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { DashboardPageSkeleton } from '@/components/dashboard-skeletons';

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

// Fallback KPI data when API is unavailable (for demo mode)
const FALLBACK_KPI_DATA: KPIData = {
  tenant: 'demo-tenant',
  timestamp: new Date().toISOString(),
  trustScore: 90,
  principleScores: {
    CONSENT_ARCHITECTURE: 9.2,
    INSPECTION_MANDATE: 8.9,
    CONTINUOUS_VALIDATION: 8.8,
    ETHICAL_OVERRIDE: 9.1,
    RIGHT_TO_DISCONNECT: 9.0,
    MORAL_RECOGNITION: 9.2,
  },
  totalInteractions: 6932,
  activeAgents: 5,
  complianceRate: 92.3,
  riskScore: 2.3,
  alertsCount: 3,
  experimentsRunning: 2,
  orchestratorsActive: 1,
  sonateDimensions: {
    realityIndex: 8.9,
    trustProtocol: 'PASS',
    ethicalAlignment: 9.04,
    resonanceQuality: 'COHERENT',
    canvasParity: 90,
  },
  trends: {
    trustScore: { change: 2.4, direction: 'up' },
    interactions: { change: 12.5, direction: 'up' },
    compliance: { change: 1.2, direction: 'up' },
    risk: { change: -0.8, direction: 'down' },
  },
};

const FALLBACK_ALERTS = {
  tenant: 'demo-tenant',
  summary: {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
    total: 6,
  },
  alerts: [
    {
      id: 'alert-001',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'trust_degradation',
      title: 'Minor Trust Score Fluctuation',
      description: 'Agent "Nova" trust score dropped 0.3 points in last hour',
      severity: 'warning' as const,
    },
    {
      id: 'alert-002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'emergence_detected',
      title: 'Weak Emergence Pattern Detected',
      description: 'Bedau Index reached 0.42 - within normal range',
      severity: 'info' as const,
    },
  ],
};

const FALLBACK_EXPERIMENTS = {
  experiments: [
    {
      id: 'exp-001',
      name: 'Resonance Threshold Calibration',
      status: 'running',
      progress: 72,
      variants: [
        { name: 'Control (0.7)', avgScore: 7.2, sampleSize: 1245 },
        { name: 'Treatment (0.5)', avgScore: 7.8, sampleSize: 1189 },
      ],
      metrics: { significant: true, effectSize: 0.42, pValue: 0.0023 },
    },
    {
      id: 'exp-002',
      name: 'Bedau Index Window Size',
      status: 'running',
      progress: 45,
      variants: [
        { name: '10 interactions', avgScore: 6.8, sampleSize: 678 },
        { name: '25 interactions', avgScore: 7.1, sampleSize: 645 },
      ],
      metrics: { significant: false, effectSize: 0.18, pValue: 0.089 },
    },
  ],
  summary: { total: 5, running: 2, completed: 3 },
};

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
  const [tenant, setTenant] = useState('default');
  const [usingFallback, setUsingFallback] = useState(false);
  
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data: kpiData, isLoading: kpiLoading, isError: kpiError } = useQuery({
    queryKey: ['kpis', tenant],
    queryFn: () => api.getKPIs(tenant),
    retry: 1,
  });

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
    retry: 1,
  });

  const { data: alertData, isLoading: alertLoading } = useQuery({
    queryKey: ['alerts', tenant],
    queryFn: () => api.getAlerts(tenant),
    retry: 1,
  });

  const { data: experimentData, isLoading: experimentLoading } = useQuery({
    queryKey: ['experiments', tenant],
    queryFn: () => api.getExperiments(),
    retry: 1,
  });

  // Use fallback data if API fails or returns empty
  const kpis = kpiData || (kpiError ? FALLBACK_KPI_DATA : null);
  const alerts = (alertData as any)?.data || alertData || FALLBACK_ALERTS;
  const experiments = (experimentData as any)?.data || experimentData || FALLBACK_EXPERIMENTS;

  // Track if we're using fallback data
  useEffect(() => {
    if (kpiError || (!kpiLoading && !kpiData)) {
      setUsingFallback(true);
    }
  }, [kpiError, kpiLoading, kpiData]);

  if (kpiLoading) {
    return <DashboardPageSkeleton />;
  }

  // If still no data after loading, use fallback
  const displayKpis = kpis || FALLBACK_KPI_DATA;

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
          {usingFallback ? (
            <div className="data-source-badge data-source-synthetic">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Demo Data
            </div>
          ) : (
            <div className="data-source-badge data-source-live">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Production Data
            </div>
          )}
        </div>
      </div>

      <OverseerWidget />

      {displayKpis && (
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
                  <span className="text-3xl font-bold">{displayKpis.trustScore}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Overall platform trust</p>
                  {displayKpis.trends?.trustScore && <TrendIndicator {...displayKpis.trends.trustScore} />}
                </div>
                <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--detect-primary)] transition-all" 
                    style={{ width: `${displayKpis.trustScore}%` }} 
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
                  <span className="text-3xl font-bold">{displayKpis.activeAgents}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {displayKpis.totalInteractions?.toLocaleString() || 0} total interactions
                </p>
                <div className="flex items-center justify-between mt-2">
                  {displayKpis.trends?.interactions && <TrendIndicator {...displayKpis.trends.interactions} />}
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
                      <InfoTooltip term="SYMBI Framework" />
                    </CardTitle>
                    <CardDescription>6 SYMBI Principles (Layer 1)</CardDescription>
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
