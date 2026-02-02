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
  Activity,
  UserCheck,
  Eye,
  Power,
  Heart,
  Sparkles,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { OverseerWidget } from '@/components/overseer-widget';
import { WithDemoWatermark } from '@/components/demo-watermark';
import { DashboardPageSkeleton } from '@/components/dashboard-skeletons';
import { HumanReadableSummary } from '@/components/HumanReadableSummary';
import { SemanticCoprocessorStatus } from '@/components/SemanticCoprocessorStatus';
import { PhaseShiftVelocityWidget } from '@/components/PhaseShiftVelocityWidget';
import { LinguisticEmergenceWidget } from '@/components/LinguisticEmergenceWidget';
import { DriftDetectionWidget } from '@/components/DriftDetectionWidget';
import { ModeIndicator } from '@/components/ModeIndicator';
import { InsightsPanel } from '@/components/InsightsPanel';
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
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    error: 'border-l-red-500',
    neutral: 'border-l-[var(--detect-primary)]'
  };
  
  return (
    <Card className={`border-l-4 ${statusColors[status || 'neutral']}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1">
          {title}
          {tooltipTerm && <InfoTooltip term={tooltipTerm} />}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Overall platform</p>
          {trend && <TrendIndicator {...trend} />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPageV2() {
  const { isDemo } = useDemo();

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

  if (kpiLoading) {
    return <DashboardPageSkeleton />;
  }

  const trustScoreStatus = kpis?.trustScore ?? 0 >= 80 ? 'success' : kpis?.trustScore ?? 0 >= 60 ? 'warning' : 'error';
  const alertsStatus = (alerts?.summary?.total ?? 0) > 5 ? 'warning' : (alerts?.summary?.total ?? 0) > 0 ? 'neutral' : 'success';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
            <ModeIndicator />
          </div>
          <p className="text-muted-foreground">
            Real-time AI trust monitoring with behavioral analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{kpis?.activeAgents ?? 0}</span> active agents
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{kpis?.totalInteractions?.toLocaleString() ?? 0}</span> interactions
          </div>
        </div>
      </div>

      {/* Human-Readable Summary */}
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

      {/* System Status Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <OverseerWidget />
        <SemanticCoprocessorStatus />
      </div>

      {kpis && (
        <>
          {/* PANEL 1: Hero KPIs */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--detect-primary)]" />
              Key Performance Indicators
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Trust Score"
                value={kpis.trustScore}
                unit="/100"
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
                icon={AlertTriangle}
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
          </section>

          {/* PANEL 2: Hidden Gems - NEW! */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Behavioral Analysis & Safety Monitoring
              <InfoTooltip term="Hidden Gems" />
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <PhaseShiftVelocityWidget compact={true} />
              </div>
              <div className="lg:col-span-1">
                <LinguisticEmergenceWidget compact={true} />
              </div>
              <div className="lg:col-span-1">
                <DriftDetectionWidget compact={true} />
              </div>
            </div>
          </section>

          {/* PANEL 2.5: Actionable Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[var(--detect-primary)]" />
              Actionable Insights
              <InfoTooltip term="Actionable Insights" />
            </h2>
            <InsightsPanel compact={true} limit={3} />
          </section>

          {/* PANEL 3: Trust Analysis */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Waves className="h-5 w-5 text-[var(--detect-primary)]" />
              Constitutional & Trust Analysis
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* SONATE Principles */}
              <WithDemoWatermark position="top-right" size="sm" opacity={25}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-purple-500" />
                          SONATE Principles
                          <InfoTooltip term="SONATE Framework" />
                        </CardTitle>
                        <CardDescription>6 Constitutional Principles (Layer 1)</CardDescription>
                      </div>
                      <span className="module-badge badge-detect">CORE</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <UserCheck className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Consent</p>
                          <p className="font-semibold text-emerald-500">8.5/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">25%</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <Eye className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Inspection</p>
                          <p className="font-semibold text-emerald-500">9.0/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">20%</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <Activity className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Validation</p>
                          <p className="font-semibold text-emerald-500">8.0/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">20%</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <AlertTriangle className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Override</p>
                          <p className="font-semibold text-emerald-500">9.5/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">15%</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <Power className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Disconnect</p>
                          <p className="font-semibold text-emerald-500">10.0/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">10%</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--detect-bg)]">
                          <Heart className="h-5 w-5 text-[var(--detect-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Moral</p>
                          <p className="font-semibold text-emerald-500">8.0/10</p>
                        </div>
                        <div className="text-xs text-muted-foreground">10%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WithDemoWatermark>

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
                          <p className="text-xs text-muted-foreground">Bedau Index</p>
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
          </section>
        </>
      )}
    </div>
  );
}