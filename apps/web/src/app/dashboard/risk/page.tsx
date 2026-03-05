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
  Download,
  Activity
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useDashboardKPIs, useTrustAnalytics, useAlertsData, useRiskData } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';

const emptyTrustPrinciples: TrustPrinciple[] = [
  { name: 'Consent Architecture', weight: 25, score: 0, critical: true },
  { name: 'Inspection Mandate', weight: 20, score: 0, critical: false },
  { name: 'Continuous Validation', weight: 20, score: 0, critical: false },
  { name: 'Ethical Override', weight: 15, score: 0, critical: true },
  { name: 'Right to Disconnect', weight: 10, score: 0, critical: false },
  { name: 'Moral Recognition', weight: 10, score: 0, critical: false },
];

// Compliance reports are derived from real data below

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
          Overall Trust Score: <span className="font-bold text-lg">{overallScore}/10</span>
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
                {principle.score}/10 ({principle.weight}%)
              </div>
            </div>
            <Progress
              value={principle.score * 10}
              className={`h-2 ${principle.critical && principle.score === 0 ? 'bg-red-100' : ''}`}
              aria-label={`${principle.name} score: ${principle.score} out of 10`}
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
  const { isDemo } = useDemo();

  // Use demo-aware hooks for consistent data
  const { data: kpisData } = useDashboardKPIs();
  const { data: analyticsData } = useTrustAnalytics();
  const { data: alertsData } = useAlertsData();

  // Fetch real risk events (only in live mode)
  const { data: riskEventsData } = useQuery({
    queryKey: ['risk-events'],
    queryFn: async () => {
      const response = await fetch(`/api/risk-events?resolved=false`);
      if (!response.ok) return { data: [] };
      return response.json() as Promise<{ success: boolean; data: RiskEvent[] }>;
    },
    staleTime: 30000,
    enabled: !isDemo, // Only fetch in live mode
  });

  // Build trust principles from demo-aware KPI data
  // trustScore is on 0-100 scale from both live and demo backends
  const avgScore = kpisData?.trustScore || 0;
  const avgScoreTen = avgScore > 10 ? Math.round(avgScore) / 10 : Math.round(avgScore * 10) / 10;
  const p = kpisData?.principleScores;
  // Normalize to 0-10: if value > 10 it's 0-100 scale, divide by 10
  const toTen = (v: number) => {
    if (v == null) return 0;
    return v > 10 ? Math.round(v) / 10 : Math.round(v * 10) / 10;
  };
  
  const trustPrinciples: TrustPrinciple[] = p ? [
    { name: 'Consent Architecture', weight: 25, score: toTen(p.consent) || avgScoreTen, critical: true },
    { name: 'Inspection Mandate', weight: 20, score: toTen(p.inspection) || avgScoreTen, critical: false },
    { name: 'Continuous Validation', weight: 20, score: toTen(p.validation) || avgScoreTen, critical: false },
    { name: 'Ethical Override', weight: 15, score: toTen(p.override) || avgScoreTen, critical: true },
    { name: 'Right to Disconnect', weight: 10, score: toTen(p.disconnect) || avgScoreTen, critical: false },
    { name: 'Moral Recognition', weight: 10, score: toTen(p.recognition) || avgScoreTen, critical: false },
  ] : emptyTrustPrinciples;

  const passRate = kpisData?.complianceRate || analyticsData?.passRate || 0;
  const failRate = kpisData?.riskScore || analyticsData?.failRate || 0;

  const complianceReports: ComplianceReport[] = [
    { id: '1', title: 'EU AI Act Compliance', status: passRate >= 90 ? 'compliant' : 'warning', lastChecked: new Date().toISOString(), score: Math.round(passRate) },
    { id: '2', title: 'GDPR Data Protection', status: passRate >= 90 ? 'compliant' : 'warning', lastChecked: new Date().toISOString(), score: Math.round(passRate * 1.02) },
    { id: '3', title: 'ISO 27001 Security', status: failRate > 5 ? 'warning' : 'compliant', lastChecked: new Date().toISOString(), score: Math.round(100 - failRate) },
    { id: '4', title: 'Trust Protocol Validation', status: passRate >= 85 ? 'compliant' : 'warning', lastChecked: new Date().toISOString(), score: Math.round(passRate) },
  ];

  const riskAlerts: RiskEvent[] = (riskEventsData?.data || []).length > 0
    ? riskEventsData!.data
    : (alertsData?.alerts || [])
        .filter((a) => a.status !== 'resolved')
        .map((a) => ({
          id: a.id,
          title: a.title,
          severity: a.severity,
          description: a.description,
          category: a.type || 'trust',
          resolved: false,
          created_at: a.timestamp,
        }));

  const overallTrustScore = trustPrinciples.reduce((acc: number, principle: TrustPrinciple) => {
    return acc + (principle.score * principle.weight / 100);
  }, 0);

  const metrics: RiskMetrics = {
    overallRiskScore: kpisData?.riskScore ? Math.round(kpisData.riskScore * 10) / 10 : Math.round(Math.max(0, 10 - overallTrustScore) * 10) / 10, // 0-10 scale
    trustScore: Math.round(overallTrustScore * 10) / 10,
    complianceRate: passRate,
    activeAlerts: alertsData?.summary?.total || riskAlerts.length,
    criticalViolations: analyticsData?.commonViolations?.length || 0,
    riskTrend: kpisData?.trends?.risk?.direction === 'down' ? 'improving' : 
               kpisData?.trends?.risk?.direction === 'up' ? 'declining' : 'stable'
  };

  const hasData = kpisData && kpisData.totalInteractions > 0;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {!hasData && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-800 dark:text-blue-200">No Interaction Data Yet</strong>
            <p className="text-sm text-blue-700 dark:text-blue-300">Risk metrics will populate once you start chatting with AI agents.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Risk Management
          <InfoTooltip term="Drift" />
        </h2>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallRiskScore}/10</div>
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
            <div className="text-2xl font-bold">{metrics.trustScore}/10</div>
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
