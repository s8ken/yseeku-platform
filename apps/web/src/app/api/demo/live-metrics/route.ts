/**
 * Demo Live Metrics API Route
 *
 * Returns real-time style metrics from demo-seed.ts.
 * All counts are consistent with:
 * - /api/demo/kpis (trustScore, activeAgents)
 * - /api/demo/alerts (alert counts by severity)
 * - /api/demo/agents (agent count)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_LIVE_METRICS_BASELINE,
  resolveTimestamp,
} from '@/lib/demo-seed';

export async function GET(_request: NextRequest) {
  try {
    const recentActivity = DEMO_LIVE_METRICS_BASELINE.recentActivity.map((activity) => ({
      type: activity.type,
      agent: activity.agent,
      action: activity.action,
      timestamp: resolveTimestamp(activity.timestampOffset),
      trustDelta: activity.trustDelta,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tenant: 'demo-tenant',
        timestamp: new Date().toISOString(),

        // ── Trust (consistent with KPI baseline) ─────────────────────────
        trustScoreAvg: DEMO_LIVE_METRICS_BASELINE.trustScoreAvg,
        trustScoreTrend: DEMO_LIVE_METRICS_BASELINE.trustScoreTrend,
        principleScores: { ...DEMO_LIVE_METRICS_BASELINE.principleScores },

        // ── Agent count (consistent with KPI + agents route) ──────────────
        activeAgents: DEMO_LIVE_METRICS_BASELINE.activeAgents,

        // ── Interaction throughput ────────────────────────────────────────
        interactionsLast5Min: DEMO_LIVE_METRICS_BASELINE.interactionsLast5Min,
        interactionsPerMinute: [...DEMO_LIVE_METRICS_BASELINE.interactionsPerMinute],

        // ── Alerts (consistent with /api/demo/alerts summary) ─────────────
        alerts: { ...DEMO_LIVE_METRICS_BASELINE.alerts },

        // ── Recent activity feed ──────────────────────────────────────────
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Demo live-metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo live metrics' },
      { status: 500 }
    );
  }
}