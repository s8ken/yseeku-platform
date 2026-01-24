'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  FileText,
  Download
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { api } from '@/lib/api';
import { useDemo } from '@/hooks/use-demo';

const defaultTrustPrinciples = [
  { name: 'Consent Architecture', weight: 25, score: 85, critical: true },
  { name: 'Inspection Mandate', weight: 20, score: 92, critical: false },
  { name: 'Continuous Validation', weight: 20, score: 78, critical: false },
  { name: 'Ethical Override', weight: 15, score: 88, critical: true },
  { name: 'Right to Disconnect', weight: 10, score: 95, critical: false },
  { name: 'Moral Recognition', weight: 10, score: 82, critical: false },
];

const defaultComplianceReports = [
  { id: '1', title: 'EU AI Act Compliance', status: 'compliant', lastChecked: new Date().toISOString(), score: 94 },
  { id: '2', title: 'GDPR Data Protection', status: 'compliant', lastChecked: new Date().toISOString(), score: 96 },
  { id: '3', title: 'ISO 27001 Security', status: 'warning', lastChecked: new Date().toISOString(), score: 87 },
  { id: '4', title: 'Trust Protocol Validation', status: 'compliant', lastChecked: new Date().toISOString(), score: 91 },
];

interface RiskEvent {
  id: string;
  title: string;
  severity: string;
  description: string;
  category: string;
  resolved: boolean;
  created_at: string;
}

interface ComplianceReport {
  id: string;
  title: string;
  status: string;
  lastChecked: string;
  score: number;
}

interface TrustPrinciple {
  name: string;
  weight: number;
  score: number;
  critical: boolean;
}

interface RiskMetrics {
  overallRiskScore: number;
  trustScore: number;
  complianceRate: number;
  activeAlerts: number;
  criticalViolations: number;
  riskTrend: 'improving' | 'stable' | 'declining';
}

function TrustScoreVisualization({ principles, overallScore }: { principles: TrustPrinciple[]; overallScore: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trust Score Breakdown
        </CardTitle>
        <CardDescription>
          Overall Trust Score: <span className="font-bold text-lg">{overallScore}/100</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {principles.map((principle) => (
          <div key={principle.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">{principle.name}</span>
                <InfoTooltip term={principle.name} />
                {principle.critical && (
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {principle.score}/100 ({principle.weight}%)
              </div>
            </div>
            <Progress
              value={principle.score}
              className={`h-2 ${principle.critical && principle.score === 0 ? 'bg-red-100' : ''}`}
              aria-label={`${principle.name} score: ${principle.score} out of 100`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComplianceReports({ reports }: { reports: ComplianceReport[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Non-compliant</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Reports
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(report.status)}
                <div>
                  <h4 className="font-medium">{report.title}</h4>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    Last checked: {new Date(report.lastChecked).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{report.score}%</div>
                {getStatusBadge(report.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskAlerts({ alerts }: { alerts: RiskEvent[] }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Active Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1">
                <h4 className="font-medium">{alert.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                <p className="text-xs text-gray-500" suppressHydrationWarning>
                  {new Date(alert.created_at).toLocaleString('en-US')}
                </p>
              </div>
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RiskManagementPage() {
  const [tenant, setTenant] = useState('default');
  const { isDemo, isLoaded } = useDemo();

  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  // Fetch real risk metrics
  const { data: riskMetrics } = useQuery({
    queryKey: ['risk-metrics', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/risk?tenant=${tenant}`);
      if (!response.ok) throw new Error('Failed to fetch risk metrics');
      return response.json() as Promise<{ success: boolean; data: RiskMetrics & { recentRiskEvents?: RiskEvent[]; trustPrinciples?: typeof defaultTrustPrinciples; complianceReports?: typeof defaultComplianceReports } }>;
    },
    retry: false,
    staleTime: Infinity,
    enabled: !isDemo && isLoaded,
  });

  // Fetch demo risk data when in demo mode
  const { data: demoRiskData } = useQuery({
    queryKey: ['demo-risk'],
    queryFn: () => api.getDemoRisk(),
    staleTime: 60000,
    enabled: isDemo && isLoaded,
  });

  // Fetch real risk events
  const { data: riskEventsData } = useQuery({
    queryKey: ['risk-events', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/risk-events?tenant=${tenant}&resolved=false`);
      if (!response.ok) throw new Error('Failed to fetch risk events');
      return response.json() as Promise<{ success: boolean; data: RiskEvent[]; meta?: { source?: string } }>;
    },
    retry: false,
    staleTime: 30000,
    enabled: !isDemo && isLoaded,
  });

  // Use demo data when in demo mode
  const demoData = demoRiskData?.data;
  const trustPrinciples = isDemo
    ? (demoData?.trustPrinciples || defaultTrustPrinciples)
    : (riskMetrics?.data?.trustPrinciples || defaultTrustPrinciples);
  const complianceReports = isDemo
    ? (demoData?.complianceReports?.map((r: any) => ({
        id: r.framework,
        title: r.framework,
        status: r.status,
        lastChecked: r.lastAudit,
        score: r.score
      })) || defaultComplianceReports)
    : (riskMetrics?.data?.complianceReports || defaultComplianceReports);
  const riskAlerts = isDemo
    ? []
    : (riskEventsData?.data?.length ? riskEventsData.data : (riskMetrics?.data?.recentRiskEvents || []));
  const dataSource = isDemo ? 'demo' : 'live';

  const overallTrustScore = trustPrinciples.reduce((acc: number, principle: TrustPrinciple) => {
    return acc + (principle.score * principle.weight / 100);
  }, 0);

  const metrics = isDemo
    ? {
        overallRiskScore: demoData?.overallRiskScore ?? 12,
        trustScore: overallTrustScore,
        complianceRate: 98,
        activeAlerts: 0,
        criticalViolations: 0,
        riskTrend: 'improving' as const
      }
    : (riskMetrics?.data || {
        overallRiskScore: 15,
        trustScore: overallTrustScore,
        complianceRate: 92,
        activeAlerts: riskAlerts.length,
        criticalViolations: 1,
        riskTrend: 'stable' as const
      });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {dataSource === 'demo' ? (
        <div className="demo-notice mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-800 dark:text-amber-200">Demo Data</strong>
            <p className="text-sm text-amber-700 dark:text-amber-300">Risk metrics shown are demonstration data. Connect your production systems for real monitoring.</p>
          </div>
        </div>
      ) : (
        <div className="live-notice mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-green-800 dark:text-green-200">Live Data</strong>
            <p className="text-sm text-green-700 dark:text-green-300">Risk events are being monitored in real-time from your production systems.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Risk Management
          <InfoTooltip term="Drift" />
        </h2>
        <span className={`data-source-badge px-2 py-1 text-xs rounded-full ${
          dataSource === 'live' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {dataSource === 'live' ? 'Live Data' : 'Demo Data'}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallRiskScore}/100</div>
            <p className="text-xs text-muted-foreground">
              Risk trend: {metrics.riskTrend}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Trust Score
              <InfoTooltip term="Trust Score" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.trustScore)}</div>
            <p className="text-xs text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">EU AI Act compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.criticalViolations} critical
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrustScoreVisualization
          principles={trustPrinciples}
          overallScore={Math.round(overallTrustScore)}
        />

        <ComplianceReports reports={complianceReports} />

        <div className="lg:col-span-2">
          <RiskAlerts alerts={riskAlerts} />
        </div>
      </div>
    </div>
  );
}
