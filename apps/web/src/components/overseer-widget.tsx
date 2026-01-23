'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Database,
  ArrowRight,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OverseerMetrics {
  systemTrustScore?: number;
  activeAgents?: number;
  totalAlerts?: number;
  avgEffectiveness?: number;
  recommendationsCount?: number;
  memoryCount?: number;
  lastCycleMode?: 'advisory' | 'enforced';
  actionsExecuted?: number;
  actionsPending?: number;
}

interface OverseerStatus {
  status: string;
  message: string;
  lastThought: string;
  metrics?: OverseerMetrics;
  mode?: 'advisory' | 'enforced';
}

export function OverseerWidget() {
  const [tenant, setTenant] = useState('default');

  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      setTenant(t || 'default');
    } catch {
      setTenant('default');
    }
  }, []);

  const { data: overseerStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['overseer-status'],
    queryFn: () => api.getOverseerStatus(),
    refetchInterval: 30000
  });

  // Fetch effectiveness data
  const { data: effectivenessData } = useQuery({
    queryKey: ['brain-effectiveness', tenant],
    queryFn: () => api.getActionEffectiveness(tenant),
    staleTime: 60000,
    enabled: !!tenant
  });

  // Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['brain-recommendations', tenant],
    queryFn: () => api.getActionRecommendations(tenant),
    staleTime: 60000,
    enabled: !!tenant
  });

  const [isThinking, setIsThinking] = useState(false);

  const handleThink = async () => {
    try {
      setIsThinking(true);
      await api.triggerOverseerThink();
      setTimeout(() => {
        refetch();
        setIsThinking(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger thinking cycle:', error);
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (error) console.error('Overseer Widget Error:', error);
    // Debug: overseer status updates can be tracked via React DevTools if needed
  }, [overseerStatus, error]);

  // Calculate aggregate effectiveness
  const avgEffectiveness = effectivenessData?.length
    ? effectivenessData.reduce((sum: number, e: any) => sum + e.effectivenessScore, 0) / effectivenessData.length
    : null;

  const highPriorityRecommendations = recommendationsData?.filter(
    r => r.priority === 'high' || r.priority === 'critical'
  ).length || 0;

  if (isLoading) return <div className="h-32 w-full bg-muted/50 animate-pulse rounded-lg mb-6" />;

  if (error) {
    return (
      <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
        <div className="font-bold mb-1">System Brain Connection Failed</div>
        <div className="font-mono text-xs opacity-75">{error instanceof Error ? error.message : String(error)}</div>
      </div>
    );
  }

  if (!overseerStatus) {
    return (
      <div className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-400 text-sm">
        Waiting for Overseer status...
      </div>
    );
  }

  const status = overseerStatus as OverseerStatus;
  const mode = status.mode || status.metrics?.lastCycleMode || 'advisory';

  return (
    <div className="space-y-4 mb-6">
      {/* Header with Status and Mode */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/brain" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Brain size={16} />
          <span>System Brain Dashboard</span>
          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </Link>
        <div className="flex items-center gap-2">
          {/* Mode Badge */}
          <Badge variant={mode === 'enforced' ? 'default' : 'secondary'} className="text-xs">
            {mode === 'enforced' ? (
              <>
                <Zap size={12} className="mr-1" />
                Enforced
              </>
            ) : (
              <>
                <Activity size={12} className="mr-1" />
                Advisory
              </>
            )}
          </Badge>
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
            status.status === 'active'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
          }`}>
            <Brain size={16} className={status.status === 'active' ? "animate-pulse" : ""} />
            OVERSEER: {status.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main Banner */}
      {status.message && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-none text-white overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Brain size={120} />
          </div>
          <CardContent className="p-6 relative z-10">
            {/* Top Section - Message and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                  <Brain size={20} className="text-purple-400" />
                  System Brain Active
                </h3>
                <p className="text-slate-300 text-lg font-light max-w-2xl italic">
                  "{status.message}"
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white min-w-[160px]"
                  onClick={handleThink}
                  disabled={isThinking}
                >
                  {isThinking ? (
                    <>
                      <Brain size={16} className="mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-2" />
                      Force Think Cycle
                    </>
                  )}
                </Button>
                <Link href="/dashboard/brain">
                  <Button
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white hover:bg-white/10"
                    size="sm"
                  >
                    View Full Dashboard
                    <ArrowRight size={14} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-white/10">
              {/* System Trust */}
              <MetricCard
                icon={<Shield size={14} />}
                label="System Trust"
                value={status.metrics?.systemTrustScore?.toFixed(1) || 'N/A'}
                suffix="/10"
                trend={status.metrics?.systemTrustScore ? (status.metrics.systemTrustScore >= 7 ? 'up' : status.metrics.systemTrustScore >= 5 ? 'stable' : 'down') : undefined}
              />

              {/* Active Agents */}
              <MetricCard
                icon={<Activity size={14} />}
                label="Active Agents"
                value={status.metrics?.activeAgents ?? 'N/A'}
              />

              {/* Effectiveness */}
              <MetricCard
                icon={<TrendingUp size={14} />}
                label="Effectiveness"
                value={avgEffectiveness !== null ? `${Math.round(avgEffectiveness * 100)}%` : 'N/A'}
                trend={avgEffectiveness !== null ? (avgEffectiveness >= 0.7 ? 'up' : avgEffectiveness >= 0.5 ? 'stable' : 'down') : undefined}
              />

              {/* Recommendations */}
              <MetricCard
                icon={<Lightbulb size={14} />}
                label="Recommendations"
                value={recommendationsData?.length ?? 0}
                highlight={highPriorityRecommendations > 0}
                subtitle={highPriorityRecommendations > 0 ? `${highPriorityRecommendations} high priority` : undefined}
              />

              {/* Actions Executed */}
              <MetricCard
                icon={<CheckCircle size={14} />}
                label="Executed"
                value={status.metrics?.actionsExecuted ?? 0}
              />

              {/* Last Thought */}
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                  <Zap size={12} />
                  Last Thought
                </span>
                <span className="text-sm font-medium text-slate-300">
                  <TimeDisplay date={status.lastThought} />
                </span>
              </div>
            </div>

            {/* Effectiveness Progress Bar */}
            {avgEffectiveness !== null && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Action Effectiveness Score</span>
                  <span className="text-xs text-slate-400">{Math.round(avgEffectiveness * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      avgEffectiveness >= 0.7 ? 'bg-green-500' :
                      avgEffectiveness >= 0.5 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${avgEffectiveness * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* High Priority Recommendations Alert */}
            {highPriorityRecommendations > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <span className="text-sm text-amber-300">
                    {highPriorityRecommendations} high-priority recommendation{highPriorityRecommendations > 1 ? 's' : ''} pending review
                  </span>
                </div>
                <Link href="/dashboard/brain?tab=recommendations">
                  <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                    Review
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down' | 'stable';
  highlight?: boolean;
  subtitle?: string;
}

function MetricCard({ icon, label, value, suffix, trend, highlight, subtitle }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
        {icon}
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
        {trend && <TrendIcon size={12} className={trendColor} />}
      </div>
      {subtitle && (
        <span className="text-xs text-amber-400">{subtitle}</span>
      )}
    </div>
  );
}

function TimeDisplay({ date }: { date: string }) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    try {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        setTime('Just now');
      } else if (diffMins < 60) {
        setTime(`${diffMins}m ago`);
      } else if (diffMins < 1440) {
        setTime(`${Math.floor(diffMins / 60)}h ago`);
      } else {
        setTime(d.toLocaleDateString());
      }
    } catch {
      setTime('Just now');
    }
  }, [date]);

  return <>{time || '...'}</>;
}
