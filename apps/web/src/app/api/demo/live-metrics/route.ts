import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        tenant: 'demo-tenant',
        timestamp: new Date().toISOString(),
        trustScoreAvg: 7.1,
        trustScoreTrend: 0.3,
        activeAgents: 12,
        interactionsLast5Min: 34,
        interactionsPerMinute: [6, 7, 5, 8, 6, 5],
        alerts: {
          critical: 2,
          warning: 8,
          info: 18,
        },
        recentActivity: [
          {
            type: 'interaction',
            agent: 'claude-agent-1',
            action: 'verified',
            timestamp: new Date().toISOString(),
            trustDelta: 0.2,
          },
          {
            type: 'policy_check',
            agent: 'gpt4-agent-2',
            action: 'passed',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            trustDelta: 0.1,
          },
        ],
      }
    });
  } catch (error) {
    console.error('Demo live-metrics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo live metrics' },
      { status: 500 }
    );
  }
}
