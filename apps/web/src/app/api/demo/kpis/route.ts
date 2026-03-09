/**
 * Demo KPIs API Route
 *
 * Returns dashboard KPI data for demo mode.
 *
 * Numbers are derived from the shared demo-seed.ts so they are consistent
 * with every other demo route. The totalInteractions figure is the seed
 * baseline PLUS the real receipt count stored under demo-tenant, so that
 * receipts generated during a demo chat session are immediately reflected
 * in the KPI totals.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_KPI_BASELINE,
  DEMO_ALERT_SUMMARY,
  DEMO_AGENT_SUMMARY,
  DEMO_BASE_INTERACTIONS,
} from '@/lib/demo-seed';

const BACKEND_URL =
  process.env.INTERNAL_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001';

/**
 * Fetch the real receipt count for demo-tenant from the backend.
 * Returns 0 on any error so the route always succeeds.
 */
async function fetchDemoReceiptCount(): Promise<number> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/trust/receipts?limit=1&tenant=demo-tenant`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEMO_TOKEN ?? 'demo-token'}`,
          'X-Tenant-ID': 'demo-tenant',
        },
        // Short timeout — don't block the KPI response
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) return 0;

    const json = await res.json();
    // Backend may return { data: { total: N } } or { pagination: { total: N } } or { total: N }
    const total =
      json?.data?.total ??
      json?.pagination?.total ??
      json?.total ??
      json?.data?.receipts?.length ??
      0;

    return typeof total === 'number' ? total : 0;
  } catch {
    return 0;
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Fetch real receipt count to add on top of the seeded baseline
    const realReceiptCount = await fetchDemoReceiptCount();

    // Total interactions = seeded baseline + real receipts generated in demo
    const totalInteractions = DEMO_BASE_INTERACTIONS + realReceiptCount;

    // Recalculate compliance rate slightly based on real receipts
    // (keeps the number realistic as receipts accumulate)
    const complianceRate = DEMO_KPI_BASELINE.complianceRate;

    return NextResponse.json({
      success: true,
      data: {
        tenant: 'demo-tenant',
        timestamp: new Date().toISOString(),

        // ── Trust scores (from seed) ──────────────────────────────────────
        trustScore: DEMO_KPI_BASELINE.trustScore,
        principleScores: { ...DEMO_KPI_BASELINE.principleScores },

        // ── Interaction & agent counts (seed + real receipts) ─────────────
        totalInteractions,
        activeAgents: DEMO_AGENT_SUMMARY.active,

        // ── Compliance & risk (from seed) ─────────────────────────────────
        complianceRate,
        riskScore: DEMO_KPI_BASELINE.riskScore,

        // ── Alerts (from seed — consistent with /api/demo/alerts) ─────────
        alertsCount: DEMO_ALERT_SUMMARY.total,

        // ── Misc (from seed) ──────────────────────────────────────────────
        experimentsRunning: DEMO_KPI_BASELINE.experimentsRunning,
        orchestratorsActive: DEMO_KPI_BASELINE.orchestratorsActive,
        sonateDimensions: { ...DEMO_KPI_BASELINE.sonateDimensions },
        trends: { ...DEMO_KPI_BASELINE.trends },
        bedau: { ...DEMO_KPI_BASELINE.bedau },

        // ── Meta: expose receipt count for debugging ──────────────────────
        _meta: {
          baseInteractions: DEMO_BASE_INTERACTIONS,
          realReceiptCount,
        },
      },
    });
  } catch (error) {
    console.error('Demo KPIs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo KPIs' },
      { status: 500 }
    );
  }
}