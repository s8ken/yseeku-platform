'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Gauge as GaugeIcon,
  TrendingUp,
  AlertTriangle,
  Zap,
  Database,
  Shield,
  Network,
  Clock,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Button } from '@/components/ui/button';

interface MetricData {
  name: string;
  help: string;
  type: 'counter' | 'histogram' | 'gauge';
  values: Array<{
    value: number;
    labels: Record<string, string>;
    timestamp?: number;
  }>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

function parsePrometheusMetrics(text: string): MetricData[] {
  const metrics: Map<string, MetricData> = new Map();
  const lines = text.split('\n');

  let currentMetric: string | null = null;
  let currentHelp: string | null = null;
  let currentType: 'counter' | 'histogram' | 'gauge' | null = null;

  for (const line of lines) {
    if (line.startsWith('# HELP ')) {
      const parts = line.substring(7).split(' ');
      currentMetric = parts[0];
      currentHelp = parts.slice(1).join(' ');
    } else if (line.startsWith('# TYPE ')) {
      const parts = line.substring(7).split(' ');
      currentType = parts[1] as 'counter' | 'histogram' | 'gauge';
    } else if (line && !line.startsWith('#') && currentMetric && currentType) {
      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*(?:\{[^}]*\})?)?\s+([0-9.eE+-]+)/);
      if (match) {
        const [, labelPart, valueStr] = match;
        const value = parseFloat(valueStr);

        let metricName = currentMetric;
        const labels: Record<string, string> = {};

        if (labelPart?.includes('{')) {
          const labelMatch = labelPart.match(/([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}/);
          if (labelMatch) {
            metricName = labelMatch[1];
            const labelPairs = labelMatch[2].split(',');
            for (const pair of labelPairs) {
              const [key, val] = pair.split('=');
              labels[key.trim()] = val?.trim().replace(/"/g, '') || '';
            }
          }
        }

        if (!metrics.has(metricName)) {
          metrics.set(metricName, {
            name: metricName,
            help: currentHelp || '',
            type: currentType,
            values: [],
          });
        }

        metrics.get(metricName)?.values.push({ value, labels, timestamp: Date.now() });
      }
    }
  }

  return Array.from(metrics.values());
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; direction: 'up' | 'down' };
  status?: 'healthy' | 'warning' | 'critical';
}) {
  const statusColors = {
    healthy: 'text-emerald-500',
    warning: 'text-amber-500',
    critical: 'text-red-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${status ? statusColors[status] : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend.direction === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            <TrendingUp className={`h-3 w-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
            {Math.abs(trend.value)}% {trend.direction === 'up' ? 'increase' : 'decrease'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['prometheus-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const text = await response.text();
      return parsePrometheusMetrics(text);
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        return {
          status: 'unhealthy' as const,
          timestamp: new Date().toISOString(),
          version: 'unknown',
          uptime: 0,
          checks: {
            database: { status: 'down' as const, error: 'Failed to fetch' },
            memory: { status: 'critical' as const, used: 0, total: 0, percentage: 0 },
          },
        };
      }
      return response.json() as Promise<HealthStatus>;
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Extract key metrics
  const getTotalValue = (metricName: string): number => {
    const metric = metricsData?.find((m) => m.name === metricName);
    if (!metric) return 0;
    return metric.values.reduce((sum, v) => sum + v.value, 0);
  };

  const getLatestValue = (metricName: string): number => {
    const metric = metricsData?.find((m) => m.name === metricName);
    if (!metric || metric.values.length === 0) return 0;
    return metric.values[metric.values.length - 1].value;
  };

  const getMetricByLabel = (metricName: string, labelKey: string, labelValue: string): number => {
    const metric = metricsData?.find((m) => m.name === metricName);
    if (!metric) return 0;
    const match = metric.values.find((v) => v.labels[labelKey] === labelValue);
    return match?.value || 0;
  };

  const trustReceiptsTotal = getTotalValue('sonate_trust_receipts_total');
  const activeWorkflows = getLatestValue('sonate_active_workflows');
  const activeAgents = getLatestValue('sonate_active_agents');
  const securityAlerts = getTotalValue('sonate_security_alerts_total');
  const httpRequestsTotal = getTotalValue('sonate_http_requests_total');
  const workflowFailures = getTotalValue('sonate_workflow_failures_total');
  const authFailures = getTotalValue('sonate_auth_failures_total');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            System Monitoring
            <InfoTooltip term="KPI" />
          </h1>
          <p className="text-muted-foreground">Real-time metrics and system health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMetrics();
              refetchHealth();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <Card className={`border-l-4 ${
        healthData?.status === 'healthy' ? 'border-l-emerald-500' :
        healthData?.status === 'degraded' ? 'border-l-amber-500' : 'border-l-red-500'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthData?.status === 'healthy' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            System Health: {healthLoading ? 'Checking...' : healthData?.status.toUpperCase()}
          </CardTitle>
          <CardDescription>
            Uptime: {healthData?.uptime ? Math.floor(healthData.uptime / 3600) : 0}h {healthData?.uptime ? Math.floor((healthData.uptime % 3600) / 60) : 0}m
            {' • '}Version: {healthData?.version || 'unknown'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className={`h-4 w-4 ${healthData?.checks.database.status === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">Database: {healthData?.checks.database.status === 'up' ? 'Connected' : 'Disconnected'}</span>
              </div>
              {healthData?.checks.database.latency && (
                <p className="text-xs text-muted-foreground ml-6">Latency: {healthData.checks.database.latency}ms</p>
              )}
              {healthData?.checks.database.error && (
                <p className="text-xs text-red-500 ml-6">{healthData.checks.database.error}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GaugeIcon className={`h-4 w-4 ${
                  healthData?.checks.memory.status === 'ok' ? 'text-emerald-500' :
                  healthData?.checks.memory.status === 'warning' ? 'text-amber-500' : 'text-red-500'
                }`} />
                <span className="text-sm font-medium">Memory: {healthData?.checks.memory.status.toUpperCase()}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {healthData?.checks.memory.used}MB / {healthData?.checks.memory.total}MB ({healthData?.checks.memory.percentage}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Trust Receipts"
          value={trustReceiptsTotal.toLocaleString()}
          description="Total receipts generated"
          icon={Shield}
          status={trustReceiptsTotal > 0 ? 'healthy' : 'warning'}
        />
        <MetricCard
          title="Active Workflows"
          value={activeWorkflows}
          description="Currently executing"
          icon={Activity}
          status={activeWorkflows < 10 ? 'healthy' : 'warning'}
        />
        <MetricCard
          title="Active Agents"
          value={activeAgents}
          description="Connected and ready"
          icon={Network}
          status={activeAgents > 0 ? 'healthy' : 'warning'}
        />
        <MetricCard
          title="Security Alerts"
          value={securityAlerts}
          description="Total security events"
          icon={AlertTriangle}
          status={securityAlerts === 0 ? 'healthy' : securityAlerts < 5 ? 'warning' : 'critical'}
        />
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="trust" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trust">Trust & Resonance</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="trust" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Trust Receipts Generated"
              value={trustReceiptsTotal.toLocaleString()}
              description="Lifetime total"
              icon={Shield}
            />
            <MetricCard
              title="Trust Verifications"
              value={getTotalValue('sonate_trust_verifications_total').toLocaleString()}
              description="Total verifications performed"
              icon={CheckCircle2}
            />
            <MetricCard
              title="Resonance Receipts"
              value={getTotalValue('sonate_resonance_receipts_total').toLocaleString()}
              description="R_m calculations"
              icon={Activity}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trust Score Distribution</CardTitle>
              <CardDescription>Distribution of trust scores across all interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Metric: <code>sonate_trust_score</code> (Histogram)
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metricsLoading ? 'Loading histogram data...' : `${metricsData?.find(m => m.name === 'sonate_trust_score')?.values.length || 0} data points collected`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Active Workflows"
              value={activeWorkflows}
              description="Currently running"
              icon={Activity}
            />
            <MetricCard
              title="Workflow Failures"
              value={workflowFailures}
              description="Total failures"
              icon={XCircle}
              status={workflowFailures === 0 ? 'healthy' : 'critical'}
            />
            <MetricCard
              title="Avg Duration"
              value="N/A"
              description="Calculated from histogram"
              icon={Clock}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Execution duration and success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Metric: <code>sonate_workflow_duration_seconds</code> (Histogram)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Active Agents"
              value={activeAgents}
              description="Currently connected"
              icon={Network}
            />
            <MetricCard
              title="Agent Operations"
              value={getTotalValue('sonate_agent_operations_total').toLocaleString()}
              description="Total operations"
              icon={Activity}
            />
            <MetricCard
              title="Avg Response Time"
              value="N/A"
              description="From histogram"
              icon={Clock}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="HTTP Requests"
              value={httpRequestsTotal.toLocaleString()}
              description="Total API calls"
              icon={Network}
            />
            <MetricCard
              title="Cache Operations"
              value={getTotalValue('sonate_cache_operations_total').toLocaleString()}
              description="Total cache hits/misses"
              icon={Zap}
            />
            <MetricCard
              title="External API Calls"
              value={getTotalValue('sonate_external_api_calls_total').toLocaleString()}
              description="Outbound requests"
              icon={Network}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>Query duration and throughput</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Metric: <code>sonate_db_query_duration_seconds</code> (Histogram)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Security Alerts"
              value={securityAlerts}
              description="Total security events"
              icon={AlertTriangle}
              status={securityAlerts === 0 ? 'healthy' : 'critical'}
            />
            <MetricCard
              title="Auth Failures"
              value={authFailures}
              description="Failed login attempts"
              icon={Shield}
              status={authFailures === 0 ? 'healthy' : authFailures < 10 ? 'warning' : 'critical'}
            />
            <MetricCard
              title="Rate Limit Hits"
              value={getTotalValue('sonate_rate_limit_hits_total')}
              description="Blocked requests"
              icon={XCircle}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Raw Metrics Browser */}
      <Card>
        <CardHeader>
          <CardTitle>All Metrics ({metricsData?.length || 0})</CardTitle>
          <CardDescription>Complete list of Prometheus metrics being collected</CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metricsData?.map((metric) => (
                <details key={metric.name} className="group">
                  <summary className="cursor-pointer text-sm font-mono hover:bg-muted p-2 rounded">
                    <span className="font-bold">{metric.name}</span>
                    <span className="text-muted-foreground ml-2">({metric.type})</span>
                    <span className="text-muted-foreground ml-2 text-xs">• {metric.values.length} values</span>
                  </summary>
                  <div className="pl-4 mt-2 text-xs text-muted-foreground space-y-1">
                    <p className="italic">{metric.help}</p>
                    <div className="font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
                      {metric.values.slice(0, 10).map((val, idx) => (
                        <div key={idx}>
                          {Object.keys(val.labels).length > 0 && `{${Object.entries(val.labels).map(([k, v]) => `${k}="${v}"`).join(', ')}} `}
                          {val.value}
                        </div>
                      ))}
                      {metric.values.length > 10 && (
                        <div className="text-muted-foreground">... and {metric.values.length - 10} more</div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
