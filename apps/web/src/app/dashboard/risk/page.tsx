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

// Mock data for trust score visualization
const trustPrinciples = [
  { name: 'Consent Architecture', weight: 25, score: 85, critical: true },
  { name: 'Inspection Mandate', weight: 20, score: 92, critical: false },
  { name: 'Continuous Validation', weight: 20, score: 78, critical: false },
  { name: 'Ethical Override', weight: 15, score: 88, critical: true },
  { name: 'Right to Disconnect', weight: 10, score: 95, critical: false },
  { name: 'Moral Recognition', weight: 10, score: 82, critical: false },
];

const complianceReports = [
  { id: '1', title: 'EU AI Act Compliance', status: 'compliant', lastChecked: '2024-12-01', score: 94 },
  { id: '2', title: 'GDPR Data Protection', status: 'compliant', lastChecked: '2024-11-28', score: 96 },
  { id: '3', title: 'ISO 27001 Security', status: 'warning', lastChecked: '2024-11-25', score: 87 },
  { id: '4', title: 'Trust Protocol Validation', status: 'compliant', lastChecked: '2024-12-01', score: 91 },
];

const riskAlerts = [
  { id: '1', title: 'Low Trust Score Trend', severity: 'warning', description: 'Overall trust score decreased by 3% this week', timestamp: '2024-12-01T10:30:00Z' },
  { id: '2', title: 'Compliance Check Failed', severity: 'error', description: 'EU AI Act compliance check failed for agent deployment', timestamp: '2024-11-30T14:15:00Z' },
  { id: '3', title: 'Security Incident Detected', severity: 'critical', description: 'Unauthorized access attempt to trust protocol data', timestamp: '2024-11-29T09:45:00Z' },
];

interface RiskMetrics {
  overallRiskScore: number;
  trustScore: number;
  complianceRate: number;
  activeAlerts: number;
  criticalViolations: number;
  riskTrend: 'improving' | 'stable' | 'declining';
}

function TrustScoreVisualization({ principles, overallScore }: { principles: typeof trustPrinciples; overallScore: number }) {
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

function ComplianceReports({ reports }: { reports: typeof complianceReports }) {
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

function RiskAlerts({ alerts }: { alerts: typeof riskAlerts }) {
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
                  {new Date(alert.timestamp).toLocaleString('en-US')}
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
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data: riskMetrics } = useQuery({
    queryKey: ['risk-metrics', tenant],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/risk?tenant=${tenant}`);
      if (!response.ok) throw new Error('Failed to fetch risk metrics');
      return response.json() as Promise<{ success: boolean; data: RiskMetrics }>;
    },
    retry: false,
    staleTime: Infinity,
  });

  const overallTrustScore = trustPrinciples.reduce((acc, principle) => {
    return acc + (principle.score * principle.weight / 100);
  }, 0);

  const metrics = riskMetrics?.data || {
    overallRiskScore: 15,
    trustScore: overallTrustScore,
    complianceRate: 92,
    activeAlerts: riskAlerts.length,
    criticalViolations: 1,
    riskTrend: 'stable' as const
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
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
