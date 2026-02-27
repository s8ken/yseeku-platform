'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, Activity, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useDemo } from '@/hooks/use-demo';

interface SemanticCoprocessorStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackActivations: number;
  isAvailable: boolean;
  lastHealthCheck: number;
}

interface CoprocessorHealth {
  status: 'ok' | 'degraded' | 'error';
  available: boolean;
  mode: 'provider' | 'sidecar' | 'structural';
  provider?: string;
  model?: string;
  message?: string;
  models_loaded?: Record<string, string>;
  version?: string;
  uptime_seconds?: number;
  cache_stats?: {
    hits: number;
    misses: number;
    total: number;
  };
}

export function SemanticCoprocessorStatus() {
  const { isDemo } = useDemo();

  // In demo mode, show honest heuristic-based scoring stats
  const { data: stats, isLoading: statsLoading } = useQuery<SemanticCoprocessorStats>({
    queryKey: ['semantic-coprocessor-stats'],
    queryFn: async () => {
      if (isDemo) {
        // Demo stats — honestly reflecting heuristic-based analysis
        return {
          totalRequests: 1503,
          successfulRequests: 1428,
          failedRequests: 15,
          fallbackActivations: 1503, // All requests use heuristic fallback when coprocessor is not deployed
          isAvailable: false,
          lastHealthCheck: Date.now(),
        };
      }
      
      const res = await fetch('/api/semantic-coprocessor/stats');
      if (!res.ok) throw new Error('Failed to fetch coprocessor stats');
      return res.json();
    },
    enabled: !isDemo, // Only fetch in live mode
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: health, isLoading: healthLoading } = useQuery<CoprocessorHealth>({
    queryKey: ['semantic-coprocessor-health'],
    queryFn: async () => {
      if (isDemo) {
        // Demo: coprocessor not deployed, heuristic mode active
        return {
          status: 'degraded' as const,
          models_loaded: {},
          version: '1.0.0',
          uptime_seconds: 0,
          cache_stats: {
            hits: 0,
            misses: 0,
            total: 0,
          },
        };
      }
      
      const res = await fetch('/api/semantic-coprocessor/health');
      if (!res.ok) throw new Error('Failed to fetch coprocessor health');
      return res.json();
    },
    enabled: !isDemo,
    refetchInterval: 30000,
  });

  const isLoading = statsLoading || healthLoading;
  const isAvailable = stats?.isAvailable ?? false;
  const healthStatus = health?.status ?? 'error';
  const embeddingMode = health?.mode || stats?.mode || 'structural';

  // Calculate metrics
  const mlUsageRate = stats && stats.totalRequests > 0 
    ? Math.round(((stats.totalRequests - stats.fallbackActivations) / stats.totalRequests) * 100) 
    : (embeddingMode === 'provider' || embeddingMode === 'sidecar') ? 100 : 0;
  
  const successRate = stats && stats.totalRequests > 0
    ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
    : 0;
  
  const cacheHitRate = health?.cache_stats
    ? Math.round((health.cache_stats.hits / health.cache_stats.total) * 100)
    : 0;

  const StatusIcon = isAvailable ? CheckCircle2 : healthStatus === 'degraded' ? AlertTriangle : XCircle;
  const statusColor = isAvailable ? 'text-emerald-500' : healthStatus === 'degraded' ? 'text-amber-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-[var(--detect-primary)]" />
          Semantic Coprocessor
          <span className={`ml-auto ${statusColor}`}>
            {isLoading ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <StatusIcon className="h-4 w-4" />
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Mode</span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {isLoading ? 'Checking...' : embeddingMode === 'provider' ? 'API Provider' : embeddingMode === 'sidecar' ? 'ML Sidecar' : 'Structural'}
          </span>
        </div>

        {/* Provider Info */}
        {embeddingMode === 'provider' && health?.provider && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Provider</span>
            <span className="text-xs font-medium capitalize">{health.provider}</span>
          </div>
        )}

        {embeddingMode === 'provider' && health?.model && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Model</span>
            <span className="text-xs font-medium truncate max-w-[150px]" title={health.model}>
              {health.model.split('/').pop()}
            </span>
          </div>
        )}

        {/* Model Info */}
        {health?.models_loaded && Object.keys(health.models_loaded).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Loaded Models</p>
            {Object.entries(health.models_loaded).map(([type, name]) => (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{type}</span>
                <span className="font-medium truncate max-w-[150px]" title={name}>
                  {name.replace('sentence-transformers/', '').split('-')[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ML Usage Rate */}
        {stats && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {mlUsageRate > 0 ? 'ML Embeddings Rate' : 'Analysis Mode'}
              </span>
              <span className="text-xs font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {mlUsageRate > 0 ? `${mlUsageRate}%` : 'Heuristic'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--detect-primary)] transition-all" 
                style={{ width: `${Math.max(mlUsageRate, 100)}%` }} 
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {mlUsageRate > 0
                ? embeddingMode === 'provider' 
                  ? `Using ${health?.provider || 'API'} embeddings for semantic analysis`
                  : embeddingMode === 'sidecar'
                    ? `${stats.totalRequests - stats.fallbackActivations} of ${stats.totalRequests} requests used ML embeddings`
                    : 'Structural mode active'
                : `${stats.totalRequests} requests analyzed via hash-based projections (deterministic, not semantic)`}
            </p>
          </div>
        )}

        {/* Success Rate */}
        {stats && stats.totalRequests > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Success Rate</span>
            <span className="text-xs font-medium">{successRate}%</span>
          </div>
        )}

        {/* Cache Stats */}
        {health?.cache_stats && health.cache_stats.total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cache Hit Rate</span>
              <span className="text-xs font-medium">{cacheHitRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all" 
                style={{ width: `${cacheHitRate}%` }} 
              />
            </div>
          </div>
        )}

        {/* Uptime */}
        {health?.uptime_seconds && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Uptime</span>
            <span className="text-xs font-medium">
              {Math.floor(health.uptime_seconds / 3600)}h {Math.floor((health.uptime_seconds % 3600) / 60)}m
            </span>
          </div>
        )}

        {/* Version */}
        {health?.version && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Version</span>
            <span className="text-xs font-medium">{health.version}</span>
          </div>
        )}

        {/* Demo Mode Indicator */}
        {isDemo && (
          <div className="pt-2 border-t border-muted">
            <p className="text-[10px] text-muted-foreground text-center">
              Showing simulated demo data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}