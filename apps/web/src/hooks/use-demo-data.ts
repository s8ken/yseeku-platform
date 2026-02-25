'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useDemo } from './use-demo';
import { fetchAPI } from '@/lib/api/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Demo-aware data fetching hook
 * 
 * Automatically routes requests to demo or live endpoints based on demo mode state.
 * In demo mode: fetches from /api/demo/* endpoints
 * In live mode: fetches from regular /api/* endpoints
 */

interface DemoDataConfig<T> {
  queryKey: string[];
  liveEndpoint: string;
  demoEndpoint: string;
  transform?: (data: any) => T;
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>;
}

async function fetchData<T>(
  endpoint: string,
  tenantId: string,
  transform?: (data: any) => T
): Promise<T> {
  // Use fetchAPI which handles authentication (including auto guest login)
  // and sets proper headers including X-Tenant-ID
  const response = await fetchAPI<{ success: boolean; data?: any; error?: string }>(endpoint, {
    headers: {
      'X-Tenant-ID': tenantId,
    },
  });

  // When a transform is provided, pass the FULL response so transforms
  // can access sibling fields like stats, pagination, etc.
  // When no transform, extract .data for backward compatibility.
  if (transform) {
    return transform(response);
  }
  const data = (response as any).data || response;
  return data;
}

export function useDemoData<T>(config: DemoDataConfig<T>) {
  const { isDemo, isLoaded, currentTenantId } = useDemo();

  const endpoint = isDemo ? config.demoEndpoint : config.liveEndpoint;

  return useQuery<T, Error>({
    queryKey: [...config.queryKey, isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: () => fetchData<T>(endpoint, currentTenantId, config.transform),
    enabled: isLoaded, // Don't fetch until we know if we're in demo mode
    staleTime: 30000,
    ...config.options,
  });
}

/**
 * Pre-configured hooks for common dashboard data
 */

export interface DashboardKPIs {
  tenant?: string;
  timestamp?: string;
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
    // v2.0.1: Only 3 validated dimensions
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    // Deprecated fields - kept for backward compatibility, always 0
    /** @deprecated Removed in v2.0.1 - always returns 0 */
    realityIndex: number;
    /** @deprecated Removed in v2.0.1 - always returns 0 */
    canvasParity: number;
  };
  trends: {
    trustScore: { change: number; direction: string };
    interactions: { change: number; direction: string };
    compliance: { change: number; direction: string };
    risk: { change: number; direction: string };
  };
}

export function useDashboardKPIs() {
  return useDemoData<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    liveEndpoint: '/api/dashboard/kpis',
    demoEndpoint: '/api/demo/kpis',
    options: {
      // Keep cache for 2 minutes to avoid redundant API calls
      staleTime: 120000,
      // Refetch in background every 90 seconds to keep data fresh
      refetchInterval: 90000,
      // Only refetch if tab is focused (saves bandwidth on inactive tabs)
      refetchIntervalInBackground: false,
    },
  });
}

export interface LiveMetrics {
  tenant: string;
  timestamp: string;
  trustScoreAvg: number;
  trustScoreTrend: number;
  activeAgents: number;
  interactionsLast5Min: number;
  interactionsPerMinute: number[];
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  recentActivity: Array<{
    type: string;
    agent: string;
    action: string;
    timestamp: string;
    trustDelta: number;
  }>;
}

export function useLiveMetrics() {
  return useDemoData<LiveMetrics>({
    queryKey: ['live-metrics'],
    liveEndpoint: '/api/live/metrics',
    demoEndpoint: '/api/demo/live-metrics',
    options: {
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });
}

export interface AlertsData {
  alerts: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    status?: string;
    details?: Record<string, unknown>;
  }>;
  summary: {
    critical: number;
    error?: number;
    warning: number;
    info?: number;
    total: number;
  };
}

export function useAlertsData() {
  return useDemoData<AlertsData>({
    queryKey: ['alerts'],
    liveEndpoint: '/api/dashboard/alerts',
    demoEndpoint: '/api/demo/alerts',
    transform: (response) => {
      const data = response.data || response;
      return {
        alerts: data.alerts || [],
        summary: data.summary || { critical: 0, warning: 0, total: 0 },
      };
    },
  });
}

export interface RiskData {
  currentRisk: number;
  trend: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    status: 'low' | 'medium' | 'high' | 'critical';
  }>;
  history: Array<{
    date: string;
    score: number;
  }>;
}

export function useRiskData() {
  return useDemoData<RiskData>({
    queryKey: ['risk'],
    liveEndpoint: '/api/dashboard/risk',
    demoEndpoint: '/api/demo/risk',
    transform: (response) => {
      const data = response.data || response;
      return {
        currentRisk: data.currentRisk || data.riskScore || 0,
        trend: data.trend || 'stable',
        factors: data.factors || data.riskFactors || [],
        history: data.history || data.riskHistory || [],
      };
    },
  });
}

export interface TrustAnalytics {
  averageTrustScore: number;
  totalInteractions: number;
  passRate: number;
  partialRate: number;
  failRate: number;
  commonViolations: Array<{
    principle: string;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    avgTrustScore: number;
    passRate: number;
  }>;
  principleScores?: Record<string, number>;
}

export function useTrustAnalytics() {
  const { isDemo, isLoaded, currentTenantId } = useDemo();

  return useQuery<TrustAnalytics, Error>({
    // Include tenantId in query key to ensure data refreshes when tenant changes
    queryKey: ['trust-analytics', isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (isDemo) {
        // For demo mode, derive analytics from the KPIs endpoint
        const res = await fetch(`${API_BASE}/api/demo/kpis`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        const kpis = json.data;

        // Convert KPI data to analytics format
        return {
          averageTrustScore: kpis.trustScore || 0,
          totalInteractions: kpis.totalInteractions || 0,
          passRate: kpis.complianceRate || 0,
          partialRate: 100 - (kpis.complianceRate || 0) - (kpis.riskScore || 0),
          failRate: kpis.riskScore || 0,
          commonViolations: [],
          recentTrends: generateDemoTrends(kpis.trustScore),
          principleScores: kpis.principleScores || {},
        };
      }

      // Live mode - fetch real analytics from trust receipts endpoint
      // This will show actual data from live interactions
      const res = await fetch(`${API_BASE}/api/dashboard/kpis`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenantId,
        },
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      const kpis = json.data || json;

      // Convert live KPI data to analytics format
      const totalInteractions = kpis.totalInteractions || 0;
      const trustScore = kpis.trustScore || 0;
      const complianceRate = kpis.complianceRate || 0;
      const riskScore = kpis.riskScore || 0;

      return {
        averageTrustScore: trustScore,
        totalInteractions,
        passRate: complianceRate,
        partialRate: totalInteractions > 0 ? 100 - complianceRate - riskScore : 0,
        failRate: riskScore,
        commonViolations: [],
        recentTrends: generateDemoTrends(trustScore),
        principleScores: kpis.principleScores || {},
      };
    },
    enabled: isLoaded,
    staleTime: 30000,
  });
}

// Generate stable trend data for demo mode (no randomness)
function generateDemoTrends(currentScore: number): Array<{ date: string; avgTrustScore: number; passRate: number }> {
  const trends = [];
  const now = new Date();

  // Fixed variations for each day - deterministic pattern
  const variations = [0.3, -0.2, 0.1, -0.1, 0.2, -0.15, 0];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Use fixed variation instead of random
    const variation = variations[6 - i] || 0;
    const score = Math.min(10, Math.max(0, currentScore + variation));

    trends.push({
      date: date.toISOString().split('T')[0],
      avgTrustScore: Math.round(score * 10) / 10,
      passRate: Math.round((score / 10) * 100),
    });
  }

  return trends;
}

export interface ReceiptsData {
  receipts: Array<{
    id: string;
    session_id: string;
    agent_id?: string;
    trust_score: number;
    hash: string;
    verified: boolean;
    created_at: string;
    ciq_metrics?: {
      clarity: number;
      integrity: number;
      quality: number;
    };
  }>;
  total: number;
  stats?: {
    total: number;
    verified: number;
    invalid: number;
    chainLength: number;
  };
}

export function useReceiptsData(limit = 20) {
  const { isDemo } = useDemo();
  // Always fetch from live endpoint - receipts are real even in demo mode
  // Demo mode creates real receipts under demo-tenant, which we want to show
  return useDemoData<ReceiptsData>({
    queryKey: ['receipts', String(limit)],
    liveEndpoint: `/api/trust/receipts/list?limit=${limit}`,
    demoEndpoint: `/api/trust/receipts/list?limit=${limit}`, // Use real endpoint in demo too
    transform: (response) => {
      // response is the full API response: { success, data: [...], stats: {...}, pagination: {...} }
      const rawReceipts = response.data || response.receipts || response || [];
      const receipts = (Array.isArray(rawReceipts) ? rawReceipts : []).map((r: any) => {
        // In demo mode, mark receipts as verified based on CIQ quality
        const hasSignature = !!r.signature;
        const demoVerified = r.ciq_metrics ? r.ciq_metrics.quality >= 0.5 : true;

        // CIQ metrics from DB are on 0-1 scale; scale to 0-10 for display
        const ciq = r.ciq_metrics;
        const scale = (v: number) => (v != null && v <= 1 ? v * 10 : v ?? 0);
        const clarity10 = scale(ciq?.clarity);
        const integrity10 = scale(ciq?.integrity);
        const quality10 = scale(ciq?.quality);

        // Prefer overall_trust_score from receipt (0-100 → 0-10)
        const avgCiq = r.overall_trust_score != null
          ? Math.round(r.overall_trust_score) / 10
          : ciq
            ? Math.round(((clarity10 + integrity10 + quality10) / 3) * 10) / 10
            : 0;

        return {
          id: r._id || r.id || r.self_hash,
          session_id: r.session_id || '',
          agent_id: r.agent_id,
          trust_score: avgCiq, // 0-10 scale
          hash: r.self_hash || r.hash || '',
          verified: isDemo ? demoVerified : hasSignature,
          created_at: r.createdAt || new Date(r.timestamp || Date.now()).toISOString(),
          ciq_metrics: r.ciq_metrics,
          // Pass through SONATE principle scores and other fields
          sonate_principles: r.sonate_principles,
          overall_trust_score: r.overall_trust_score,
          signature: r.signature,
          previous_hash: r.previous_hash,
          agent_did: r.agent_did,
          human_did: r.human_did,
          timestamp: r.timestamp,
        };
      });

      // Use stats from API response (available because transform gets full response)
      const stats = response.stats || {
        total: response.pagination?.total || receipts.length,
        verified: receipts.filter((r: any) => r.verified).length,
        invalid: receipts.filter((r: any) => !r.verified).length,
        chainLength: response.pagination?.total || receipts.length,
      };

      return {
        receipts,
        total: stats.total,
        stats,
      };
    },
  });
}

export interface OverseerData {
  mode: string;
  status: string;
  lastCycle: {
    startedAt: string;
    completedAt: string;
    thought: string;
    metrics: {
      agentCount: number;
      avgTrust: number;
      alertsProcessed: number;
      actionsPlanned: number;
    };
    actions: Array<{
      type: string;
      target: string;
      reason: string;
      status: string;
    }>;
  };
  recentCycles: Array<{
    id: string;
    timestamp: string;
    mode: string;
    status: string;
    actionsCount: number;
  }>;
}

export function useOverseerData() {
  return useDemoData<OverseerData>({
    queryKey: ['overseer'],
    liveEndpoint: '/api/overseer/status',
    demoEndpoint: '/api/demo/overseer',
  });
}
