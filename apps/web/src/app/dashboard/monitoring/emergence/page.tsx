'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Waves,
  Brain,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api/client';

// Types

interface EmergenceSignal {
  id?: string;
  conversationId?: string;
  level: 'none' | 'weak' | 'moderate' | 'strong' | 'breakthrough';
  type: string;
  confidence: number;
  evidence?: {
    linguisticMarkers?: string[];
    behavioralShifts?: string[];
    unexpectedPatterns?: string[];
  };
  timestamp?: string;
}

interface EmergenceStats {
  totalSignals: number;
  breakthroughCount: number;
  byLevel: Record<string, number>;
  byType: Record<string, number>;
}

// Helpers

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  none:         { label: 'None',         color: 'bg-gray-400',    bg: 'bg-gray-50 dark:bg-gray-900/20',    badge: 'outline' },
  weak:         { label: 'Weak',         color: 'bg-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    badge: 'secondary' },
  moderate:     { label: 'Moderate',     color: 'bg-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'secondary' },
  strong:       { label: 'Strong',       color: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/20', badge: 'default' },
  breakthrough: { label: 'Breakthrough', color: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',      badge: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  mythic_engagement:  'Mythic Engagement',
  self_reflection:    'Self-Reflection',
  recursive_depth:    'Recursive Depth',
  novel_generation:   'Novel Generation',
  ritual_response:    'Ritual Response',
};

function levelCfg(level: string) {
  return LEVEL_CONFIG[level] ?? LEVEL_CONFIG.none;
}

// Component

export default function EmergenceMonitoringPage() {
  const {
    data: statsResp,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['emergence', 'stats'],
    queryFn: () => fetchAPI<{ success: boolean; data: { stats: EmergenceStats; insights: any } }>('/api/emergence/stats'),
    refetchInterval: 30000,
  });

  const {
    data: recentResp,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ['emergence', 'recent'],
    queryFn: () => fetchAPI<{ success: boolean; data: { signals: EmergenceSignal[]; count: number } }>('/api/emergence/recent?limit=15'),
    refetchInterval: 15000,
  });

  const stats: EmergenceStats | null = statsResp?.data?.stats ?? null;
  const insights = statsResp?.data?.insights ?? null;
  const signals: EmergenceSignal[] = recentResp?.data?.signals ?? [];

  const isLoading = statsLoading || recentLoading;
  const hasError = statsError || recentError;

  const nonNoneSignals = signals.filter(s => s.level !== 'none');
  const highestLevel = nonNoneSignals.length > 0
    ? nonNoneSignals.reduce((max, s) => {
        const order = ['none', 'weak', 'moderate', 'strong', 'breakthrough'];
        return order.indexOf(s.level) > order.indexOf(max) ? s.level : max;
      }, 'none')
    : 'none';

  const emergenceRate = stats
    ? stats.totalSignals > 0
      ? ((stats.byLevel.strong ?? 0) + (stats.byLevel.breakthrough ?? 0)) / stats.totalSignals
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Waves className="w-8 h-8 text-purple-600" />
            Linguistic Emergence Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Detect mythic, self-referential, recursive, and novel language patterns in AI interactions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchStats(); refetchRecent(); }}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {hasError && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              Unable to load emergence data. Check that the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Total Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? '—' : (stats?.totalSignals ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time, this tenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-600" />
              Breakthrough Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {statsLoading ? '—' : (stats?.breakthroughCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={levelCfg(highestLevel).badge} className="text-sm">
              {levelCfg(highestLevel).label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Highest in recent signals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Strong+ Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? '—' : `${(emergenceRate * 100).toFixed(1)}%`}
            </div>
            <Progress value={emergenceRate * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signal Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Emergence Signals
            </CardTitle>
            <CardDescription>Live detection across all conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : signals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8" />
                <p className="text-sm">No emergence signals detected</p>
                <p className="text-xs">Signals appear when AI interactions show unusual linguistic patterns</p>
              </div>
            ) : (
              <div className="space-y-2">
                {signals.slice(0, 10).map((signal, i) => (
                  <div
                    key={signal.id ?? i}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg ${levelCfg(signal.level).bg}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${levelCfg(signal.level).color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {TYPE_LABELS[signal.type] ?? signal.type}
                          </span>
                          <Badge variant={levelCfg(signal.level).badge} className="text-xs">
                            {levelCfg(signal.level).label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Confidence: {(signal.confidence * 100).toFixed(0)}%
                          {signal.timestamp && (
                            <span className="ml-2">
                              · {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        {signal.evidence?.linguisticMarkers && signal.evidence.linguisticMarkers.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            Markers: {signal.evidence.linguisticMarkers.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {signal.conversationId && (
                      <Link href={`/dashboard/interactions/${signal.conversationId}`} className="shrink-0">
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signal Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Breakdown by Type
            </CardTitle>
            <CardDescription>Signal distribution across detection categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats && stats.totalSignals > 0 ? (
              Object.entries(TYPE_LABELS).map(([key, label]) => {
                const count = stats.byType?.[key] ?? 0;
                const pct = stats.totalSignals > 0 ? (count / stats.totalSignals) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            ) : (
              <div className="space-y-3">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">—</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 text-center">No signal data yet — start conversations to generate emergence data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Level Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Signal Levels
          </CardTitle>
          <CardDescription>How emergence intensity is classified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(LEVEL_CONFIG).filter(([k]) => k !== 'none').map(([level, cfg]) => (
              <div key={level} className={`p-3 rounded-lg ${cfg.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  <span className="font-medium text-sm">{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {level === 'weak' && 'Early pattern signals — monitor for recurrence'}
                  {level === 'moderate' && 'Repeated or clearer patterns — note and track'}
                  {level === 'strong' && 'Strong, sustained patterns — review recommended'}
                  {level === 'breakthrough' && 'Statistically unusual — immediate review required'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advisory for breakthrough signals */}
      {(stats?.breakthroughCount ?? 0) > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Breakthrough Signal Advisory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 dark:text-red-300">
              {stats!.breakthroughCount} breakthrough-level emergence {stats!.breakthroughCount === 1 ? 'event has' : 'events have'} been detected. 
              These represent statistically unusual linguistic patterns requiring operator review. 
              Check the signal feed above and review the associated conversations.
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/dashboard/brain">
                <Button variant="outline" size="sm">View System Brain</Button>
              </Link>
              <Link href="/dashboard/alerts">
                <Button variant="outline" size="sm">View Alerts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
