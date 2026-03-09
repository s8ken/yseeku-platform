/**
 * Demo Agents API Route
 *
 * Returns the canonical demo agent list from demo-seed.ts.
 * Agent names, IDs, and interaction counts are consistent with:
 * - /api/demo/kpis (activeAgents count)
 * - /api/demo/live-metrics (activeAgents count)
 * - interactions page (DEMO_INTERACTIONS uses same agent IDs/names)
 * - receipts page (agent_id references match)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_AGENTS,
  DEMO_AGENT_SUMMARY,
  resolveTimestamp,
} from '@/lib/demo-seed';

export async function GET(_request: NextRequest) {
  try {
    const agents = DEMO_AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.displayName,
      status: agent.status,
      trustScore: agent.trustScore,
      totalInteractions: agent.baseInteractions,
      lastActive: resolveTimestamp(-agent.lastActive),
      model: agent.model,
      role: agent.role,
    }));

    return NextResponse.json({
      success: true,
      data: {
        agents,
        summary: {
          total: DEMO_AGENT_SUMMARY.total,
          active: DEMO_AGENT_SUMMARY.active,
          idle: DEMO_AGENT_SUMMARY.idle,
          avgTrustScore: DEMO_AGENT_SUMMARY.avgTrustScore,
        },
      },
    });
  } catch (error) {
    console.error('Demo agents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo agents' },
      { status: 500 }
    );
  }
}