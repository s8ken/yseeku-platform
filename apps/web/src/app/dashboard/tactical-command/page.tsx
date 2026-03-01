'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchAPI } from '@/lib/api/client';
import { useDashboardKPIs } from '@/hooks/use-demo-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Shield,
  ShieldAlert,
  Siren,
  TrendingUp,
  Waves,
  Zap,
  Play,
  Clock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveSignal {
  id: string;
  kind: 'phase-shift' | 'drift' | 'emergence';
  label: string;
  severity: 'warning' | 'critical';
  value: string;
  conversationId?: string;
  timestamp?: number;
}

interface ActionRecommendation {
  id: string;
  actionType: string;
  target?: string;
  reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface ActionLogEntry {
  id: string;
  actionType: string;
  target: string;
  executedAt: string;
  success: boolean;
  userId?: string;
  reason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KIND_ICON: Record<string, React.ReactNode> = {
  'phase-shift': <Zap className="h-4 w-4 text-blue-600" />,
  drift: <TrendingUp className="h-4 w-4 text-orange-600" />,
  emergence: <Waves className="h-4 w-4 text-purple-600" />,
};

const KIND_LABEL: Record<string, string> = {
  'phase-shift': 'Phase-Shift',
  drift: 'Drift',
  emergence: 'Emergence',
};

const PRIORITY_CONFIG: Record<string, { badge: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  critical: { badge: 'destructive', label: 'Critical' },
  high: { badge: 'default', label: 'High' },
  medium: { badge: 'secondary', label: 'Medium' },
  low: { badge: 'outline', label: 'Low' },
};

const ACTION_LABELS: Record<string, string> = {
  ban_agent: 'Ban Agent',
  restrict_agent: 'Restrict Agent',
  quarantine_agent: 'Quarantine Agent',
  unban_agent: 'Unban Agent',
  alert: 'Raise Alert',
  adjust_threshold: 'Adjust Threshold',
};

const isDestructive = (actionType: string) =>
  ['ban_agent', 'quarantine_agent', 'restrict_agent'].includes(actionType);

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncidentResponsePage() {
  // System Health KPIs
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis, isFetching: kpisFetching } = useDashboardKPIs();

  // Agents for fleet count
  const { data: agentsResp, refetch: refetchAgents, isFetching: agentsFetching } = useQuery({
    queryKey: ['incident-response', 'agents'],
    queryFn: () => api.getAgents(),
  });

  // PSV recent alerts
  const { data: psvResp, refetch: refetchPsv, isFetching: psvFetching } = useQuery({
    queryKey: ['incident-response', 'psv-recent'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { events: any[]; count: number } }>(
        '/api/phase-shift/recent?limit=5'
      ).catch(() => ({ success: false, data: { events: [], count: 0 } })),
    refetchInterval: 20000,
  });

  // Drift recent alerts
  const { data: driftResp, refetch: refetchDrift, isFetching: driftFetching } = useQuery({
    queryKey: ['incident-response', 'drift-recent'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { events: any[]; count: number } }>(
        '/api/drift/recent?limit=5'
      ).catch(() => ({ success: false, data: { events: [], count: 0 } })),
    refetchInterval: 20000,
  });

  // Emergence recent signals
  const { data: emergenceResp, refetch: refetchEmergence, isFetching: emergenceFetching } = useQuery({
    queryKey: ['incident-response', 'emergence-recent'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { signals: any[]; count: number } }>(
        '/api/emergence/recent?limit=5'
      ).catch(() => ({ success: false, data: { signals: [], count: 0 } })),
    refetchInterval: 20000,
  });

  // Brain recommendations
  const { data: recsResp, refetch: refetchRecs, isFetching: recsFetching } = useQuery({
    queryKey: ['incident-response', 'recommendations'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { recommendations: ActionRecommendation[] } }>(
        '/api/actions/recommendations'
      ).catch(() => ({ success: false, data: { recommendations: [] } })),
    refetchInterval: 30000,
  });

  // Recent action log
  const { data: logResp, refetch: refetchLog, isFetching: logFetching } = useQuery({
    queryKey: ['incident-response', 'action-log'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { log: ActionLogEntry[]; count: number } }>(
        '/api/actions/log?limit=8'
      ).catch(() => ({ success: false, data: { log: [], count: 0 } })),
    refetchInterval: 15000,
  });

  // Execute action mutation
  const executeMutation = useMutation({
    mutationFn: async (rec: ActionRecommendation) => {
      if (isDestructive(rec.actionType)) {
        const ok = window.confirm(
          `⚠️ Confirm ${ACTION_LABELS[rec.actionType] ?? rec.actionType}\n\nTarget: ${rec.target ?? 'unknown'}\nReason: ${rec.reason ?? '—'}\n\nThis action will modify agent status.`
        );
        if (!ok) throw new Error('Action cancelled by operator');
      }
      return api.executeAction({
        actionType: rec.actionType,
        target: rec.target ?? '',
        recommendationId: rec.id,
        reason: rec.reason,
      });
    },
    onSuccess: (_, rec) => {
      toast.success(`${ACTION_LABELS[rec.actionType] ?? rec.actionType} executed`, {
        description: `Target: ${rec.target ?? 'unknown'}`,
      });
      refetchLog();
    },
    onError: (err: any) => {
      if (err.message === 'Action cancelled by operator') {
        toast.info('Action cancelled');
      } else {
        toast.error('Failed to execute action', { description: err.message });
      }
    },
  });

  // ── Derived data ──────────────────────────────────────────────────────────

  const agentsSummary = useMemo(() => {
    const s = (agentsResp as any)?.data?.summary;
    return { total: Number(s?.total || 0), active: Number(s?.active || 0) };
  }, [agentsResp]);

  const activeSignals = useMemo<ActiveSignal[]>(() => {
    const signals: ActiveSignal[] = [];

    // PSV signals
    for (const ev of (psvResp as any)?.data?.events ?? []) {
      signals.push({
        id: `psv-${ev.conversationId}-${ev.timestamp}`,
        kind: 'phase-shift',
        label: `PSV ${Number(ev.currentVelocity ?? ev.velocity ?? 0).toFixed(2)} — ${ev.transitionType ?? 'phase shift'}`,
        severity: ev.alertLevel === 'red' ? 'critical' : 'warning',
        value: `v=${Number(ev.currentVelocity ?? ev.velocity ?? 0).toFixed(2)}`,
        conversationId: ev.conversationId,
        timestamp: ev.timestamp,
      });
    }

    // Drift signals
    for (const ev of (driftResp as any)?.data?.events ?? []) {
      signals.push({
        id: `drift-${ev.conversationId}-${ev.timestamp}`,
        kind: 'drift',
        label: `Drift score ${Math.round(ev.driftScore)}`,
        severity: ev.alertLevel === 'red' ? 'critical' : 'warning',
        value: `${Math.round(ev.driftScore)}/100`,
        conversationId: ev.conversationId,
        timestamp: ev.timestamp,
      });
    }

    // Emergence signals (only strong+)
    for (const s of (emergenceResp as any)?.data?.signals ?? []) {
      if (!['strong', 'breakthrough'].includes(s.level)) continue;
      signals.push({
        id: `em-${s.id ?? s.conversationId}`,
        kind: 'emergence',
        label: `${s.type?.replace(/_/g, ' ') ?? 'signal'} — ${s.level}`,
        severity: s.level === 'breakthrough' ? 'critical' : 'warning',
        value: `${(s.confidence * 100).toFixed(0)}% conf`,
        conversationId: s.conversationId,
        timestamp: s.timestamp ? new Date(s.timestamp).getTime() : undefined,
      });
    }

    // Sort by timestamp desc
    signals.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return signals;
  }, [psvResp, driftResp, emergenceResp]);

  const recommendations: ActionRecommendation[] = (recsResp as any)?.data?.recommendations ?? [];
  const actionLog: ActionLogEntry[] = (logResp as any)?.data?.log ?? [];

  const isRefreshing = kpisFetching || agentsFetching || psvFetching || driftFetching || emergenceFetching || recsFetching || logFetching;

  const handleRefreshAll = () => {
    refetchKpis(); refetchAgents(); refetchPsv(); refetchDrift();
    refetchEmergence(); refetchRecs(); refetchLog();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Siren className="h-7 w-7 text-red-600" />
            Incident Response Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Active signals, actionable recommendations, and execution log — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/brain">
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              System Brain
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trust Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : Math.round((kpis?.trustScore ?? 0) * 10)}</div>
            <Progress value={(kpis?.trustScore ?? 0) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? '—' : `${Math.round(kpis?.complianceRate ?? 0)}%`}</div>
            <Progress value={kpis?.complianceRate ?? 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(kpis?.riskScore ?? 0) > 60 ? 'text-red-600' : (kpis?.riskScore ?? 0) > 30 ? 'text-amber-600' : ''}`}>
              {kpisLoading ? '—' : (kpis?.riskScore ?? 0)}
            </div>
            <Progress value={kpis?.riskScore ?? 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentsSummary.active}</div>
            <p className="text-xs text-muted-foreground mt-1">of {agentsSummary.total} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Active Signals */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Active Signals
                {activeSignals.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{activeSignals.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Phase-Shift, Drift, and Emergence alerts requiring attention</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/dashboard/monitoring/phase-shift">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-blue-600">
                  <Zap className="h-3 w-3" /> PSV
                </Button>
              </Link>
              <Link href="/dashboard/monitoring/drift">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-orange-600">
                  <TrendingUp className="h-3 w-3" /> Drift
                </Button>
              </Link>
              <Link href="/dashboard/monitoring/emergence">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-purple-600">
                  <Waves className="h-3 w-3" /> Emergence
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeSignals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium">All clear — no active signals</p>
                <p className="text-xs">Phase-Shift, Drift, and Emergence monitors show no alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                      signal.severity === 'critical'
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{KIND_ICON[signal.kind]}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {KIND_LABEL[signal.kind]}
                          </Badge>
                          <span className="text-sm font-medium truncate">{signal.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{signal.value}</span>
                          {signal.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={signal.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {signal.severity === 'critical' ? 'Critical' : 'Warning'}
                      </Badge>
                      {signal.conversationId && (
                        <Link href={`/dashboard/interactions/${signal.conversationId}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brain Recommendations */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Brain Recommendations
            </CardTitle>
            <CardDescription>Execute AI-generated actions directly</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Shield className="h-8 w-8" />
                <p className="text-sm">No recommendations right now</p>
                <p className="text-xs">System Brain generates these based on signals</p>
                <Link href="/dashboard/brain">
                  <Button variant="outline" size="sm" className="mt-2">Open System Brain</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.slice(0, 6).map((rec: ActionRecommendation) => {
                  const priorityCfg = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.medium;
                  const isExecuting = executeMutation.isPending && (executeMutation.variables as any)?.id === rec.id;
                  return (
                    <div key={rec.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={priorityCfg.badge} className="text-xs shrink-0">
                              {priorityCfg.label}
                            </Badge>
                            <span className="text-sm font-medium">
                              {ACTION_LABELS[rec.actionType] ?? rec.actionType}
                            </span>
                          </div>
                          {rec.target && (
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                              {rec.target}
                            </div>
                          )}
                          {rec.reason && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {rec.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {Math.round(rec.confidence * 100)}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isDestructive(rec.actionType) ? 'destructive' : 'default'}
                        className="w-full gap-2 h-7 text-xs"
                        onClick={() => executeMutation.mutate(rec)}
                        disabled={isExecuting || executeMutation.isPending}
                      >
                        {isExecuting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        {isExecuting ? 'Executing…' : 'Execute'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions Log */}
        <Card className="lg:col-span-12">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Actions
              </CardTitle>
              <CardDescription>Operator-executed actions from System Brain recommendations</CardDescription>
            </div>
            <Link href="/dashboard/agents">
              <Button variant="outline" size="sm">Manage Agents</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {actionLog.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                No actions executed yet — recommendations above can be actioned directly.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {actionLog.map((entry: ActionLogEntry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${
                      entry.success ? '' : 'border-red-200 bg-red-50 dark:bg-red-900/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        )}
                        <span className="font-medium">
                          {ACTION_LABELS[entry.actionType] ?? entry.actionType}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                        {entry.target}
                      </div>
                      {entry.reason && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {entry.reason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 text-right">
                      {entry.executedAt ? new Date(entry.executedAt).toLocaleTimeString() : ''}
                      <div>{entry.executedAt ? new Date(entry.executedAt).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
