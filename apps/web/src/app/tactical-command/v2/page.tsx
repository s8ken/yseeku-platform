'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useDemoData, useDashboardKPIs } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink } from 'lucide-react';
import { TopBar } from '@/components/tactical-command-v2/TopBar';
import { KpiStrip } from '@/components/tactical-command-v2/KpiStrip';
import { AlertsPanel } from '@/components/tactical-command-v2/AlertsPanel';
import { AgentsPanel } from '@/components/tactical-command-v2/AgentsPanel';
import { WorkflowsPanel } from '@/components/tactical-command-v2/WorkflowsPanel';
import { OperatorLoop } from '@/components/tactical-command-v2/OperatorLoop';
import type { AlertsManagementResponse, DemoAlertsResponse, DemoAgentsResponse, TacticalAgentsResponse, TacticalAlerts } from '@/components/tactical-command-v2/types';

export default function TacticalCommandV2StandalonePage() {
  const { isDemo, isLoaded, toggleDemo, currentTenantId, timeRemaining, showExpiryWarning } = useDemo();

  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKpis,
    isFetching: kpisFetching,
  } = useDashboardKPIs();

  const {
    data: alerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
    isFetching: alertsFetching,
  } = useDemoData<TacticalAlerts>({
    queryKey: ['tactical-command-v2', 'alerts'],
    liveEndpoint: '/api/dashboard/alerts/management?status=active&limit=50&offset=0',
    demoEndpoint: '/api/demo/alerts',
    transform: (raw) => {
      const maybeLive = raw as AlertsManagementResponse;
      if (maybeLive?.success && maybeLive?.data?.alerts) {
        const list = maybeLive.data.alerts;
        const s = maybeLive.data.summary;
        const computed = { critical: 0, error: 0, warning: 0, info: 0, active: 0 };
        for (const a of list) {
          const sev = String(a.severity || '').toLowerCase();
          if (sev === 'critical') computed.critical += 1;
          else if (sev === 'error' || sev === 'high') computed.error += 1;
          else if (sev === 'warning' || sev === 'medium') computed.warning += 1;
          else computed.info += 1;
          computed.active += 1;
        }
        return {
          alerts: list,
          summary: {
            critical: Number(s?.critical ?? computed.critical),
            error: Number(s?.error ?? computed.error),
            warning: Number(s?.warning ?? computed.warning),
            info: Number(s?.info ?? computed.info),
            active: Number(s?.active ?? computed.active),
          },
        };
      }

      const maybeDemo = raw as DemoAlertsResponse;
      const list = Array.isArray(maybeDemo?.alerts) ? maybeDemo.alerts : [];
      const computed = { critical: 0, error: 0, warning: 0, info: 0, active: 0 };
      for (const a of list) {
        const sev = String(a.severity || '').toLowerCase();
        if (sev === 'critical') computed.critical += 1;
        else if (sev === 'error' || sev === 'high') computed.error += 1;
        else if (sev === 'warning' || sev === 'medium') computed.warning += 1;
        else computed.info += 1;
        computed.active += 1;
      }
      return {
        alerts: list,
        summary: {
          critical: Number(maybeDemo?.summary?.critical ?? computed.critical),
          error: Number(maybeDemo?.summary?.error ?? computed.error),
          warning: Number(maybeDemo?.summary?.warning ?? computed.warning),
          info: Number(maybeDemo?.summary?.info ?? computed.info),
          active: Number(maybeDemo?.summary?.active ?? computed.active),
        },
      };
    },
  });

  const {
    data: agentsResp,
    isLoading: agentsLoading,
    refetch: refetchAgents,
    isFetching: agentsFetching,
  } = useDemoData<{ agents: any[]; summary: { total: number; active: number; inactive: number; avgTrustScore: number } }>({
    queryKey: ['tactical-command-v2', 'agents'],
    liveEndpoint: '/api/agents',
    demoEndpoint: '/api/demo/agents',
    transform: (raw) => {
      const maybeLive = raw as TacticalAgentsResponse;
      if (maybeLive?.success && maybeLive?.data?.agents) {
        return {
          agents: maybeLive.data.agents,
          summary: {
            total: Number(maybeLive.data.summary?.total || maybeLive.data.agents.length || 0),
            active: Number(maybeLive.data.summary?.active || 0),
            inactive: Number(maybeLive.data.summary?.inactive || 0),
            avgTrustScore: Number(maybeLive.data.summary?.avgTrustScore || 0),
          },
        };
      }

      const maybeDemo = raw as DemoAgentsResponse;
      const list = Array.isArray(maybeDemo?.data) ? maybeDemo.data : [];
      return {
        agents: list.map((a) => ({
          id: a._id,
          name: a.name,
          trustScore: Number(a.traits?.ethical_alignment ? a.traits.ethical_alignment * 20 : 85),
          lastInteraction: a.lastActive,
        })),
        summary: {
          total: list.length,
          active: list.length,
          inactive: 0,
          avgTrustScore: list.length > 0 ? Math.round(list.reduce((sum, a) => sum + Number(a.traits?.ethical_alignment ? a.traits.ethical_alignment * 20 : 85), 0) / list.length) : 0,
        },
      };
    },
  });

  const {
    data: workflows,
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
    isFetching: workflowsFetching,
  } = useDemoData<any[]>({
    queryKey: ['tactical-command-v2', 'workflows'],
    liveEndpoint: '/api/orchestrate/workflows',
    demoEndpoint: '/api/orchestrate/workflows',
    transform: (raw) => {
      const r = raw as any;
      const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
      return list;
    },
  });

  const isRefreshing = kpisFetching || alertsFetching || agentsFetching || workflowsFetching;
  const lastUpdated = kpis?.timestamp ? new Date(kpis.timestamp).toLocaleString() : null;

  const agents = useMemo(() => {
    const list = (agentsResp as any)?.agents;
    return Array.isArray(list) ? list : [];
  }, [agentsResp]);

  const agentsSummary = useMemo(() => {
    const s = (agentsResp as any)?.summary;
    return {
      total: Number(s?.total || 0),
      active: Number(s?.active || 0),
      inactive: Number(s?.inactive || 0),
      avgTrustScore: Number(s?.avgTrustScore || 0),
    };
  }, [agentsResp]);

  const alertsList = useMemo(() => {
    const list = (alerts as any)?.alerts;
    return Array.isArray(list) ? list : [];
  }, [alerts]);

  const alertsSummary = useMemo(() => {
    const s = (alerts as any)?.summary;
    return {
      critical: Number(s?.critical || 0),
      error: Number(s?.error || 0),
      warning: Number(s?.warning || 0),
      info: Number(s?.info || 0),
      active: Number(s?.active || 0),
    };
  }, [alerts]);

  const workflowsList = useMemo(() => (Array.isArray(workflows) ? workflows : []), [workflows]);

  return (
    <div className="dark min-h-screen bg-gradient-to-b from-[#0B1020] via-[#070B18] to-[#050713] text-white">
      <TopBar
        isDemo={isDemo}
        isLoaded={isLoaded}
        currentTenantId={currentTenantId}
        timeRemaining={timeRemaining}
        showExpiryWarning={showExpiryWarning}
        isRefreshing={isRefreshing}
        onToggleDemo={() => toggleDemo()}
        onRefresh={() => {
          refetchKpis();
          refetchAlerts();
          refetchAgents();
          refetchWorkflows();
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Operational snapshot</h1>
            <div className="mt-1 text-sm text-white/60">
              KPIs, active alerts, agents, and workflows in one view.
            </div>
            {lastUpdated && <div className="mt-2 text-xs text-white/50">Last updated: {lastUpdated}</div>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/tactical-command" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10">
                Open dashboard view
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/monitoring/live" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Activity className="h-4 w-4" />
                Live Monitor
              </Button>
            </Link>
          </div>
        </div>

        <KpiStrip kpis={kpis} loading={kpisLoading} agentsLoading={agentsLoading} agentsSummary={agentsSummary} />

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <AlertsPanel loading={alertsLoading} alerts={alertsList} summary={alertsSummary} />
          <AgentsPanel loading={agentsLoading} agents={agents} />
          <WorkflowsPanel loading={workflowsLoading} workflows={workflowsList} />
          <OperatorLoop />
        </div>
      </div>
    </div>
  );
}
