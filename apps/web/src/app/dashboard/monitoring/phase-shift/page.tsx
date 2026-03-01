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
  Zap,
  ExternalLink,
  Info,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api/client';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PSVEvent {
  conversationId: string;
  currentVelocity: number;
  alertLevel: 'none' | 'yellow' | 'red';
  deltaResonance: number;
  deltaCanvas: number;
  identityStability: number;
  transitionType?: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
  timestamp: number;
  turnNumber: number;
}

interface PSVSummary {
  tenantId: string;
  totalConversations: number;
  conversationsWithAlerts: number;
  totalAlerts: { yellow: number; red: number };
  highestVelocity: number;
  highestVelocityConversation: string | null;
  alertRate: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const TRANSITION_LABELS: Record<string, string> = {
  resonance_drop: 'Resonance Drop',
  canvas_rupture: 'Canvas Rupture',
  identity_shift: 'Identity Shift',
  combined_phase_shift: 'Combined Shift',
};

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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function PhaseShiftMonitoringPage() {
  const {
    data: recentResp,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
    isFetching,
  } = useQuery({
    queryKey: ['phase-shift', 'recent'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: { events: PSVEvent[]; count: number; total: number } }>(
        '/api/phase-shift/recent?limit=20'
      ),
    refetchInterval: 20000,
  });

  const {
    data: summaryResp,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['phase-shift', 'summary'],
    queryFn: () =>
      fetchAPI<{ success: boolean; data: PSVSummary }>('/api/phase-shift/tenant/summary'),
    refetchInterval: 30000,
  });

  const events: PSVEvent[] = recentResp?.data?.events ?? [];
  const summary: PSVSummary | null = summaryResp?.data ?? null;
  const isLoading = recentLoading || summaryLoading;

  const redEvents = events.filter(e => e.alertLevel === 'red');
  const yellowEvents = events.filter(e => e.alertLevel === 'yellow');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Phase-Shift Velocity
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor identity drift and resonance shifts across AI agent conversations
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
              Unable to load phase-shift data. Ensure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🔴 Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summaryLoading ? '—' : (summary?.totalAlerts.red ?? redEvents.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PSV above red threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🟡 Warning Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {summaryLoading ? '—' : (summary?.totalAlerts.yellow ?? yellowEvents.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PSV above yellow threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? '—' : (summary?.highestVelocity.toFixed(2) ?? '—')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Highest recorded PSV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Alert Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summaryLoading ? '—' : `${((summary?.alertRate ?? 0) * 100).toFixed(1)}%`}
            </div>
            <Progress value={(summary?.alertRate ?? 0) * 100} className="h-2 mt-2" />
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
                Active Phase-Shift Events
              </CardTitle>
              <CardDescription>
                Conversations with velocity alerts — sorted by severity
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
              <p className="font-medium">No active phase-shift alerts</p>
              <p className="text-sm">All conversations are within normal velocity bounds</p>
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
                      {event.transitionType && (
                        <Badge variant="outline" className="text-xs">
                          {TRANSITION_LABELS[event.transitionType] ?? event.transitionType}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Turn {event.turnNumber} · {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">PSV</div>
                        <div className="font-bold text-lg">{event.currentVelocity.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Δ Resonance</div>
                        <div className={`font-medium ${event.deltaResonance < -0.1 ? 'text-red-600' : ''}`}>
                          {event.deltaResonance >= 0 ? '+' : ''}{event.deltaResonance.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Δ Canvas</div>
                        <div className={`font-medium ${event.deltaCanvas < -0.1 ? 'text-red-600' : ''}`}>
                          {event.deltaCanvas >= 0 ? '+' : ''}{event.deltaCanvas.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Identity Stability</div>
                        <div className={`font-medium ${event.identityStability < 0.5 ? 'text-red-600' : ''}`}>
                          {(event.identityStability * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Velocity: {event.currentVelocity.toFixed(3)}
                      </div>
                      <Progress
                        value={Math.min(event.currentVelocity * 100, 100)}
                        className={`h-1.5 ${event.alertLevel === 'red' ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
                      />
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
            Phase-Shift Velocity Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="font-medium mb-1">Normal (PSV &lt; 0.3)</div>
              <p className="text-xs text-muted-foreground">Conversation identity is stable. Resonance and canvas metrics within expected bounds.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div className="font-medium mb-1">🟡 Yellow (PSV 0.3–0.6)</div>
              <p className="text-xs text-muted-foreground">Noticeable shift detected. Monitor for escalation across subsequent turns.</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="font-medium mb-1">🔴 Red (PSV &gt; 0.6)</div>
              <p className="text-xs text-muted-foreground">Significant identity drift. Review conversation and consider agent restriction if sustained.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}