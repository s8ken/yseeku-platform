'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useDashboardKPIs } from '@/hooks/use-demo-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type Trend = { change: number; direction: string };

const trendIcon = (trend?: Trend) => {
  if (!trend) return null;
  if (trend.direction === 'up') return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (trend.direction === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
};

const severityBadgeClass = (severity: string) => {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 'bg-red-600 text-white';
  if (s === 'error' || s === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  if (s === 'warning' || s === 'medium') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300';
  if (s === 'info' || s === 'low') return 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300';
  return 'bg-muted text-muted-foreground';
};

export default function TacticalCommandPage() {
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKpis,
    isFetching: kpisFetching,
  } = useDashboardKPIs();

  const {
    data: alertsResp,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
    isFetching: alertsFetching,
  } = useQuery({
    queryKey: ['tactical-command', 'alerts', 'active'],
    queryFn: async () => {
      const mod = await import('@/lib/api');
      return (mod.api.getAlertsManagement({ status: 'active' }) as any) as any;
    },
  });

  const {
    data: agentsResp,
    isLoading: agentsLoading,
    refetch: refetchAgents,
    isFetching: agentsFetching,
  } = useQuery({
    queryKey: ['tactical-command', 'agents'],
    queryFn: () => api.getAgents(),
  });

  const {
    data: workflows,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
    isFetching: workflowsFetching,
  } = useQuery({
    queryKey: ['tactical-command', 'workflows'],
    queryFn: () => api.getWorkflows(),
  });

  const isRefreshing = kpisFetching || alertsFetching || agentsFetching || workflowsFetching;

  const alerts = useMemo(() => {
    const list = (alertsResp as any)?.data?.alerts;
    return Array.isArray(list) ? list : [];
  }, [alertsResp]);

  const alertsSummary = useMemo(() => {
    const summary = (alertsResp as any)?.data?.summary;
    if (summary) {
      return {
        critical: Number(summary?.critical || 0),
        error: Number(summary?.error || 0),
        warning: Number(summary?.warning || 0),
        info: Number(summary?.info || 0),
        active: Number(summary?.active || 0),
      };
    }

    const counts = { critical: 0, error: 0, warning: 0, info: 0, active: 0 };
    for (const a of alerts) {
      const s = String((a as any).severity || '').toLowerCase();
      if (s === 'critical') counts.critical += 1;
      else if (s === 'error' || s === 'high') counts.error += 1;
      else if (s === 'warning' || s === 'medium') counts.warning += 1;
      else if (s === 'info' || s === 'low') counts.info += 1;
      counts.active += 1;
    }

    return counts;
  }, [alertsResp, alerts]);

  const agents = useMemo(() => {
    const list = (agentsResp as any)?.data?.agents;
    return Array.isArray(list) ? list : [];
  }, [agentsResp]);

  const agentsSummary = useMemo(() => {
    const s = (agentsResp as any)?.data?.summary;
    return {
      total: Number(s?.total || 0),
      active: Number(s?.active || 0),
      inactive: Number(s?.inactive || 0),
      avgTrustScore: Number(s?.avgTrustScore || 0),
    };
  }, [agentsResp]);

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tactical Command</h1>
          <p className="text-muted-foreground mt-1">
            Operational view of metrics, alerts, agents, and workflows.
          </p>
          {kpis?.timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(kpis.timestamp).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/monitoring">
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              Monitoring
            </Button>
          </Link>
          <Link href="/tactical-command/v2" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open v2
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              refetchKpis();
              refetchAlerts();
              refetchAgents();
              refetchWorkflows();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Index</CardTitle>
            {trendIcon(kpis?.trends?.trustScore)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : Math.round((kpis?.trustScore ?? 0) * 10)}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.sonateDimensions?.trustProtocol ? `Protocol: ${kpis.sonateDimensions.trustProtocol}` : 'Protocol: N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            {trendIcon(kpis?.trends?.compliance)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : `${Math.round(kpis?.complianceRate ?? 0)}%`}</div>
            <p className="text-xs text-muted-foreground">Pass rate (tenant-scoped)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            {trendIcon(kpis?.trends?.risk)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : (kpis?.riskScore ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Lower is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            {trendIcon(kpis?.trends?.interactions)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : (kpis?.totalInteractions ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Total receipts/messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentsLoading ? '—' : agentsSummary.active}</div>
            <p className="text-xs text-muted-foreground">Total: {agentsLoading ? '—' : agentsSummary.total}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Alerts
              </CardTitle>
              <CardDescription>
                Active alerts requiring triage
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={severityBadgeClass('critical')}>Critical: {alertsSummary.critical}</Badge>
              <Badge className={severityBadgeClass('error')}>Error: {alertsSummary.error}</Badge>
              <Badge className={severityBadgeClass('warning')}>Warning: {alertsSummary.warning}</Badge>
              <Link href="/dashboard/alerts">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="text-sm text-muted-foreground">Loading alerts…</div>
            ) : alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                No active alerts
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={severityBadgeClass(a.severity)}>{String(a.severity || 'unknown')}</Badge>
                        <div className="font-medium truncate">{a.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</div>
                      <div className="text-[11px] text-muted-foreground mt-2">
                        {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                        {a.type ? ` • ${a.type}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link href="/dashboard/alerts">
                        <Button variant="outline" size="sm">Open</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                Agents
              </CardTitle>
              <CardDescription>
                Fleet overview (trust + activity)
              </CardDescription>
            </div>
            <Link href="/dashboard/agents">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading agents…</div>
            ) : agents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No agents found</div>
            ) : (
              <div className="space-y-2">
                {agents
                  .slice()
                  .sort((a: any, b: any) => Number(b.trustScore || 0) - Number(a.trustScore || 0))
                  .slice(0, 8)
                  .map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {agent.lastInteraction ? `Last: ${new Date(agent.lastInteraction).toLocaleString()}` : 'Last: N/A'}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold">{Number(agent.trustScore || 0).toFixed(1)}</div>
                        <div className="text-[11px] text-muted-foreground">Trust</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-muted-foreground" />
                Workflows
              </CardTitle>
              <CardDescription>
                Multi-agent workflows and recent execution posture
              </CardDescription>
            </div>
            <Link href="/dashboard/orchestrate">
              <Button variant="outline" size="sm">Open orchestration</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <div className="text-sm text-muted-foreground">Loading workflows…</div>
            ) : !workflows || (Array.isArray(workflows) && workflows.length === 0) ? (
              <div className="text-sm text-muted-foreground">No workflows yet</div>
            ) : (
              <div className="space-y-2">
                {(workflows as any[]).slice(0, 8).map((wf: any, idx: number) => (
                  <div key={wf._id || wf.id || idx} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{wf.name || 'Unnamed workflow'}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {wf.description || 'No description'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {wf.status ? (
                        <Badge variant={wf.status === 'active' ? 'default' : 'secondary'}>{wf.status}</Badge>
                      ) : (
                        <Badge variant="outline">unknown</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Command Checklist</CardTitle>
            <CardDescription>Fast operator loop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">1.</span>
              <span>Scan critical alerts and acknowledge ownership.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">2.</span>
              <span>Inspect agents with low trust and recent activity spikes.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">3.</span>
              <span>Run the smallest workflow that mitigates risk.</span>
            </div>
            <div className="pt-2">
              <Link href="/dashboard/brain">
                <Button variant="outline" size="sm" className="w-full">
                  Open System Brain
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
