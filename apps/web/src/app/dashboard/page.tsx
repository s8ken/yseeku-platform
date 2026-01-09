'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Activity, 
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
  BarChart3
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { OverseerWidget } from '@/components/overseer-widget';

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
  symbiDimensions: {
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
    results: {
      variants: Array<{
        variantName: string;
        averageScore: number;
        sampleSize: number;
      }>;
      statisticalAnalysis: {
        significantDifference: boolean;
        effectSize: number;
        confidenceInterval: [number, number];
        pValue: number;
      };
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

function SymbiDimensionCard({ 
  title, 
  value, 
  type, 
  icon: Icon,
  tooltipTerm
}: { 
  title: string; 
  value: string | number; 
  type: 'score' | 'status' | 'percent';
  icon: React.ComponentType<{ className?: string }>;
  tooltipTerm?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
        <Icon className="h-5 w-5 text-[var(--detect-primary)]" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {title}
          {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
        </p>
        <p className="font-semibold">
          {type === 'score' && `${value}/10`}
          {type === 'status' && value}
          {type === 'percent' && `${value}%`}
        </p>
      </div>
    </div>
  );
}

import { api } from '@/lib/api';

// ... (imports)

export default function DashboardPage() {
  const [tenant, setTenant] = useState('default');
  
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis', tenant],
    queryFn: () => api.getKPIs(tenant),
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
  });

  const { data: alertData, isLoading: alertLoading } = useQuery({
    queryKey: ['alerts', tenant],
    queryFn: () => api.getAlerts(tenant),
  });

  const { data: experimentData, isLoading: experimentLoading } = useQuery({
    queryKey: ['experiments', tenant],
    queryFn: () => api.getExperiments(),
  });

  const kpis = kpiData;
  const alerts = (alertData as any)?.data || alertData;
  const experiments = (experimentData as any)?.data || experimentData;

  if (kpiLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
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
                  <span className="text-3xl font-bold">{kpis.complianceRate}</span>
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

            <Card className={kpis.alertsCount > 5 ? 'border-l-4 border-l-amber-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{kpis.alertsCount}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {alerts && (
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-[var(--detect-primary)]" />
                      SYMBI 5-Dimension Analysis
                      <InfoTooltip term="SYMBI" />
                    </CardTitle>
                    <CardDescription>Real-time scoring framework</CardDescription>
                  </div>
                  <span className="module-badge badge-detect">DETECT</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SymbiDimensionCard 
                    title="Reality Index" 
                    value={kpis.symbiDimensions.realityIndex} 
                    type="score"
                    icon={Fingerprint}
                    tooltipTerm="Reality Index"
                  />
                  <SymbiDimensionCard 
                    title="Trust Protocol" 
                    value={kpis.symbiDimensions.trustProtocol} 
                    type="status"
                    icon={Shield}
                    tooltipTerm="Trust Protocol"
                  />
                  <SymbiDimensionCard 
                    title="Ethical Alignment" 
                    value={kpis.symbiDimensions.ethicalAlignment} 
                    type="score"
                    icon={CheckCircle2}
                    tooltipTerm="Ethical Alignment"
                  />
                  <SymbiDimensionCard 
                    title="Canvas Parity" 
                    value={kpis.symbiDimensions.canvasParity} 
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
                      <p className="font-semibold">{kpis.symbiDimensions.resonanceQuality}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {['STRONG', 'ADVANCED', 'BREAKTHROUGH'].map((level, i) => (
                      <div 
                        key={level}
                        className={`h-2 w-8 rounded-full ${
                          ['STRONG', 'ADVANCED', 'BREAKTHROUGH'].indexOf(kpis.symbiDimensions.resonanceQuality) >= i
                            ? 'bg-[var(--detect-primary)]'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                {experiments ? (
                  <div className="space-y-4">
                    {experiments.experiments.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{exp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {exp.results.variants.length} variants
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {exp.results.statisticalAnalysis.significantDifference && (
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
                          p-value <InfoTooltip term="p-value" />: {exp.results.statisticalAnalysis.pValue.toFixed(4)} | 
                          Effect <InfoTooltip term="Effect Size" />: {exp.results.statisticalAnalysis.effectSize.toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="text-center">
                      <a href="/demo/lab" className="text-sm text-[var(--lab-primary)] hover:underline">
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
                  {alerts.alerts.slice(0, 5).map((alert) => (
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
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
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
