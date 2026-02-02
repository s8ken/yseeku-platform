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
  
  // Extract data from response
  const data = (response as any).data || response;
  
  return transform ? transform(data) : data;
}

export function useDemoData<T>(config: DemoDataConfig<T>) {
  const { isDemo, isLoaded, isSwitching, currentTenantId } = useDemo();
  
  const endpoint = isDemo ? config.demoEndpoint : config.liveEndpoint;
  
  // Only log when not switching to reduce noise
  if (!isSwitching) {
    console.log('[useDemoData] Query config:', {
      queryKey: [...config.queryKey, isDemo ? 'demo' : 'live'],
      endpoint,
      currentTenantId,
      isDemo,
      isLoaded,
      isSwitching,
    });
  }
  
  return useQuery<T, Error>({
    queryKey: [...config.queryKey, isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: () => {
      console.log('[useDemoData] Fetching data:', { endpoint, currentTenantId, isDemo });
      return fetchData<T>(endpoint, currentTenantId, config.transform);
    },
    // CRITICAL: Don't fetch while switching modes - prevents race condition!
    enabled: isLoaded && !isSwitching,
    staleTime: 60000, // Default: Cache for 1 minute (was 30s)
    gcTime: 300000, // Default: Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Default: Don't refetch on focus
    refetchOnMount: false, // Default: Don't refetch on mount if cached
    refetchOnReconnect: true, // Default: Refetch on reconnect
    retry: 1, // Default: Retry failed requests once
    retryDelay: 1000, // Default: Wait 1 second before retry
    ...config.options, // Allow override of defaults
  });
}

/**
 * Pre-configured hooks for common dashboard data
 */

export interface DashboardKPIs {
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
      staleTime: 60000, // Cache for 1 minute (was 30s)
      gcTime: 300000, // Keep in cache for 5 minutes (was default)
      refetchOnWindowFocus: false, // Don't refetch on focus to reduce API calls
      refetchOnMount: false, // Don't refetch on mount if we have cached data
      refetchOnReconnect: true, // Refetch on reconnect
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
    liveEndpoint: '/api/dashboard/live',
    demoEndpoint: '/api/demo/live-metrics',
    options: {
      refetchInterval: 10000, // Poll every 10 seconds (was 5s) - reduces server load
      staleTime: 5000, // Consider data stale after 5 seconds
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
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
    transform: (data) => ({
      alerts: data.alerts || [],
      summary: data.summary || { critical: 0, warning: 0, total: 0 },
    }),
    options: {
      staleTime: 60000, // Cache for 1 minute
      gcTime: 300000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
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
    liveEndpoint: '/api/trust/risk',
    demoEndpoint: '/api/demo/risk',
    transform: (data) => ({
      currentRisk: data.currentRisk || data.riskScore || 0,
      trend: data.trend || 'stable',
      factors: data.factors || data.riskFactors || [],
      history: data.history || data.riskHistory || [],
    }),
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
  const { isDemo, isLoaded, isSwitching, currentTenantId } = useDemo();
  
  // Only log when not switching to reduce noise
  if (!isSwitching) {
    console.log('[useTrustAnalytics] Hook called:', { isDemo, isLoaded, isSwitching, currentTenantId });
  }
  
  return useQuery<TrustAnalytics, Error>({
    // Include tenantId in query key to ensure data refreshes when tenant changes
    queryKey: ['trust-analytics', isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: async () => {
      console.log('[useTrustAnalytics] Query function executing:', { isDemo, currentTenantId });
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (isDemo) {
        console.log('[useTrustAnalytics] Fetching DEMO data from /api/demo/kpis');
        // For demo mode, derive analytics from the KPIs endpoint
        const res = await fetch(`${API_BASE}/api/demo/kpis`, {
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        const kpis = json.data;
        
        console.log('[useTrustAnalytics] DEMO data received:', { totalInteractions: kpis.totalInteractions });
        
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
      
      console.log('[useTrustAnalytics] Fetching LIVE data from /api/dashboard/kpis with tenant:', currentTenantId);
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
      
      console.log('[useTrustAnalytics] LIVE data received:', { totalInteractions: kpis.totalInteractions });
      
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
    // CRITICAL: Don't fetch while switching modes - prevents race condition!
    enabled: isLoaded && !isSwitching,
    staleTime: 60000, // Cache for 1 minute (was 30s)
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
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
}

export function useReceiptsData(limit = 20) {
  return useDemoData<ReceiptsData>({
    queryKey: ['receipts', String(limit)],
    liveEndpoint: `/api/trust/receipts?limit=${limit}`,
    demoEndpoint: `/api/demo/receipts?limit=${limit}`,
    transform: (data) => ({
      receipts: data.receipts || data || [],
      total: data.total || data.receipts?.length || data?.length || 0,
    }),
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
    liveEndpoint: '/api/orchestrator/overseer/status',
    demoEndpoint: '/api/demo/overseer',
  });
}
