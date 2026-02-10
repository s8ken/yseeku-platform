'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useDemoData, useDashboardKPIs } from '@/hooks/use-demo-data';
import { useDemo } from '@/hooks/use-demo';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '@/components/tactical-command-v2/TopBar';
import { KpiStrip } from '@/components/tactical-command-v2/KpiStrip';
import { AlertsPanel } from '@/components/tactical-command-v2/AlertsPanel';
import { AgentsPanel } from '@/components/tactical-command-v2/AgentsPanel';
import { WorkflowsPanel } from '@/components/tactical-command-v2/WorkflowsPanel';
import { OperatorLoop } from '@/components/tactical-command-v2/OperatorLoop';
import { QuickActionsPanel } from '@/components/tactical-command-v2/QuickActionsPanel';
import { playAlertSound, showNotification } from '@/components/tactical-command-v2/utils';
import type { AlertsManagementResponse, DemoAlertsResponse, DemoAgentsResponse, TacticalAgentsResponse, TacticalAlerts } from '@/components/tactical-command-v2/types';

// Force dynamic rendering to avoid SSR issues with hooks
export const dynamic_config = 'force-dynamic';

// Auto-refresh intervals
const LIVE_REFRESH_INTERVAL = 10000; // 10 seconds for live mode
const DEMO_REFRESH_INTERVAL = 30000; // 30 seconds for demo mode

export default function TacticalCommandV2StandalonePage() {
  const { isDemo, isLoaded, toggleDemo, currentTenantId, timeRemaining, showExpiryWarning } = useDemo();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const prevCriticalCount = useRef<number>(0);
  
  // Generate mock trend history for sparklines (in real app, this would come from API)
  const [trendHistory, setTrendHistory] = useState<{
    trustScore: number[];
    compliance: number[];
    risk: number[];
    interactions: number[];
  }>({
    trustScore: [],
    compliance: [],
    risk: [],
    interactions: [],
  });

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
    options: {
      refetchInterval: isDemo ? DEMO_REFRESH_INTERVAL : LIVE_REFRESH_INTERVAL,
    },
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
    options: {
      refetchInterval: isDemo ? DEMO_REFRESH_INTERVAL : LIVE_REFRESH_INTERVAL,
    },
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
    options: {
      refetchInterval: isDemo ? DEMO_REFRESH_INTERVAL : LIVE_REFRESH_INTERVAL,
    },
    transform: (raw) => {
      const r = raw as any;
      const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
      return list;
    },
  });

  // Derived state (must be before effects that use them)
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

  // Refresh all data
  const handleRefreshAll = useCallback(() => {
    refetchKpis();
    refetchAlerts();
    refetchAgents();
    refetchWorkflows();
  }, [refetchKpis, refetchAlerts, refetchAgents, refetchWorkflows]);

  // Acknowledge selected alert
  const handleAcknowledgeSelected = useCallback(async () => {
    if (!selectedAlertId) {
      toast.info('No alert selected', { description: 'Click on an alert to select it first' });
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`/api/dashboard/alerts/${selectedAlertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success('Alert acknowledged');
      setSelectedAlertId(null);
      refetchAlerts();
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  }, [selectedAlertId, refetchAlerts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          handleRefreshAll();
          toast.info('Refreshing data...');
          break;
        case 'a':
          e.preventDefault();
          handleAcknowledgeSelected();
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(prev => !prev);
          break;
        case 'escape':
          setSelectedAlertId(null);
          setShowShortcuts(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefreshAll, handleAcknowledgeSelected]);

  // Track trend history for sparklines
  useEffect(() => {
    if (kpis) {
      setTrendHistory(prev => ({
        trustScore: [...prev.trustScore.slice(-11), kpis.trustScore ?? 0],
        compliance: [...prev.compliance.slice(-11), kpis.complianceRate ?? 0],
        risk: [...prev.risk.slice(-11), kpis.riskScore ?? 0],
        interactions: [...prev.interactions.slice(-11), kpis.totalInteractions ?? 0],
      }));
    }
  }, [kpis?.timestamp]);

  // Alert sound and notification for new critical alerts
  useEffect(() => {
    const currentCritical = alertsSummary?.critical ?? 0;
    if (currentCritical > prevCriticalCount.current && prevCriticalCount.current > 0) {
      playAlertSound();
      showNotification('Critical Alert', `${currentCritical - prevCriticalCount.current} new critical alert(s)`);
    }
    prevCriticalCount.current = currentCritical;
  }, [alertsSummary?.critical]);

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
        onRefresh={handleRefreshAll}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Operational snapshot</h1>
            <div className="mt-1 text-sm text-white/60">
              KPIs, active alerts, agents, and workflows in one view.
              <span className="ml-2 text-white/40">Auto-refreshes every {isDemo ? '30s' : '10s'}</span>
            </div>
            {lastUpdated && <div className="mt-2 text-xs text-white/50">Last updated: {lastUpdated}</div>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => setShowShortcuts(prev => !prev)}
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-white/20 bg-white/5 px-1.5 text-[10px]">?</kbd>
            </Button>
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

        {/* Keyboard shortcuts help */}
        {showShortcuts && (
          <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="text-sm font-medium mb-3">Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded border border-white/20 bg-white/5">R</kbd>
                <span className="text-white/60">Refresh all</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded border border-white/20 bg-white/5">A</kbd>
                <span className="text-white/60">Acknowledge alert</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded border border-white/20 bg-white/5">?</kbd>
                <span className="text-white/60">Toggle shortcuts</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded border border-white/20 bg-white/5">Esc</kbd>
                <span className="text-white/60">Clear selection</span>
              </div>
            </div>
          </div>
        )}

        <KpiStrip 
          kpis={kpis} 
          loading={kpisLoading} 
          agentsLoading={agentsLoading} 
          agentsSummary={agentsSummary}
          trendHistory={trendHistory}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <AlertsPanel 
            loading={alertsLoading} 
            alerts={alertsList} 
            summary={alertsSummary}
            selectedAlertId={selectedAlertId}
            onSelectAlert={setSelectedAlertId}
          />
          <AgentsPanel loading={agentsLoading} agents={agents} />
          <QuickActionsPanel selectedAgentId={null} />
          <WorkflowsPanel loading={workflowsLoading} workflows={workflowsList} />
          <OperatorLoop />
        </div>
      </div>
    </div>
  );
}
