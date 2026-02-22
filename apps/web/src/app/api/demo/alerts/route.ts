import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        alerts: [
          {
            id: 'alert-1',
            timestamp: new Date().toISOString(),
            type: 'policy_violation',
            title: 'Unusual interaction pattern detected',
            description: 'Agent claude-agent-1 made 15 consecutive requests in 30 seconds',
            severity: 'warning',
            status: 'open',
            details: {
              agent: 'claude-agent-1',
              pattern: 'burst_activity',
              threshold: 5,
              actual: 15,
            },
          },
          {
            id: 'alert-2',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            type: 'trust_degradation',
            title: 'Trust score decline below threshold',
            description: 'GPT-4 Agent trust score dropped from 8.1 to 7.8 (-0.3)',
            severity: 'info',
            status: 'closed',
            details: {
              agent: 'gpt4-agent-2',
              threshold: 7.0,
              current: 7.8,
              change: -0.3,
            },
          },
          {
            id: 'alert-3',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: 'policy_check_failure',
            title: 'Policy validation failed',
            description: 'Receipt verification failed for session xyz-123',
            severity: 'warning',
            status: 'open',
            details: {
              session: 'xyz-123',
              policy: 'request_signing',
              reason: 'invalid_signature',
            },
          },
        ],
        summary: {
          critical: 0,
          error: 0,
          warning: 2,
          info: 1,
          total: 3,
        },
      }
    });
  } catch (error) {
    console.error('Demo alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo alerts' },
      { status: 500 }
    );
  }
}
