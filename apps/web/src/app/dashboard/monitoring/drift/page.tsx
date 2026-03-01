'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Info,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api/client';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface DriftEvent {
  conversationId: string;
  driftScore: number;
  tokenDelta: number;
  vocabDelta: number;
  numericDelta: number;
  alertLevel: 'none' | 'yellow' | 'red';
  timestamp: number;
  turnNumber: number;
}

interface DriftSummary {
  totalConversations: number;
  avgDriftScore: number;
  highDriftCount: number;
  alertDistribution: { none: number; yellow: number; red: number };
}

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function alertBadgeClass(level: string) {
  if (level === 'red') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  if (level === 'yellow') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
}

function alertBg(level: string) {
  if (level === 'red') return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
  if (level === 'yellow') return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
  return '';
}

function deltaSign(v: number) {
  return v >= 0 ? '+' : '';
}
// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────

export default function DriftMonitoringPage() {
  const {
    data: recentResp,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
    isFetching,
  } = useQuery({
    queryKey: ['drift', 'recent'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { events: DriftEvent[]; count: number; total: number } }>(
        '/api/drift/recent?limit=20'
      ),
    refetchInterval: 20000,
  });

  const {
    data: summaryResp,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['drift', 'summary'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: DriftSummary }>('/api/drift/tenant/summary'),
    refetchInterval: 30000,
  });

  const events: DriftEvent[] = recentResp?.data?.events ?? [];
  const summary: DriftSummary | null = summaryResp?.data ?? null;
  const isLoading = recentLoading || summaryLoading;

  const redEvents = events.filter(e => e.alertLevel === 'red');
  const yellowEvents = events.filter(e => e.alertLevel === 'yellow');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            Drift Detection
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor text property changes — token length, vocabulary diversity, and numeric density
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchRecent(); refetchSummary(); }}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {recentError && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              Unable to load drift data. Ensure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Drift Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? '—' : (summary?.avgDriftScore ?? 0)}
            </div>
            <Progress value={summary?.avgDriftScore ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">0–100 scale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🔴 High Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summaryLoading ? '—' : (summary?.alertDistribution.red ?? redEvents.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score &gt; 60</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🟡 Moderate Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {summaryLoading ? '—' : (summary?.alertDistribution.yellow ?? yellowEvents.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score 30–60</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? '—' : (summary?.totalConversations ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Drift Events
              </CardTitle>
              <CardDescription>
                Conversations with drift alerts — sorted by score
              </CardDescription>
            </div>
            {events.length > 0 && (
              <div className="flex gap-2">
                <Badge className={alertBadgeClass('red')}>Red: {redEvents.length}</Badge>
                <Badge className={alertBadgeClass('yellow')}>Yellow: {yellowEvents.length}</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-medium">No active drift alerts</p>
              <p className="text-sm">All conversations are within normal drift bounds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <div
                  key={`${event.conversationId}-${i}`}
                  className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${alertBg(event.alertLevel)}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={alertBadgeClass(event.alertLevel)}>
                        {event.alertLevel.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Turn {event.turnNumber} · {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Drift score bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Drift Score</span>
                        <span className="font-bold text-foreground">{event.driftScore}/100</span>
                      </div>
                      <Progress
                        value={event.driftScore}
                        className={`h-2 ${event.alertLevel === 'red' ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
                      />
                    </div>

                    {/* Delta grid */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-0.5">Token Δ</div>
                        <div className={`font-medium ${Math.abs(event.tokenDelta) > 20 ? 'text-orange-600' : ''}`}>
                          {deltaSign(event.tokenDelta)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-0.5">Vocab Δ</div>
                        <div className={`font-medium ${Math.abs(event.vocabDelta) > 20 ? 'text-orange-600' : ''}`}>
                          {deltaSign(event.vocabDelta)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-0.5">Numeric Δ</div>
                        <div className={`font-medium ${Math.abs(event.numericDelta) > 20 ? 'text-orange-600' : ''}`}>
                          {deltaSign(event.numericDelta)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/interactions/${event.conversationId}`} className="shrink-0">
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4" />
            Drift Score Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="font-medium mb-1">Normal (0–30)</div>
              <p className="text-xs text-muted-foreground">Text properties stable. Token length, vocabulary, and numeric density within baseline.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="font-medium mb-1">🟡 Moderate (30–60)</div>
              <p className="text-xs text-muted-foreground">Noticeable shift in one or more text properties. Monitor across subsequent turns.</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="font-medium mb-1">🔴 High Drift (&gt;60)</div>
              <p className="text-xs text-muted-foreground">Significant behavioural deviation detected. Review conversation and consider intervention.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}