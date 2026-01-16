import { NextResponse } from 'next/server';

// Demo mode overseer endpoint
export async function GET() {
  try {
    const overseerData = {
      status: 'active',
      lastCheck: new Date().toISOString(),
      systemHealth: {
        overall: 0.94,
        api: 0.98,
        database: 0.96,
        ai: 0.92,
        security: 0.99
      },
      activeConnections: 3,
      totalChecks: 1250,
      issues: [
        {
          id: 'issue-1',
          severity: 'low',
          message: 'High response time on agent-2',
          timestamp: new Date(Date.now() - 900000).toISOString()
        }
      ],
      recommendations: [
        'Consider scaling agent pool during peak hours',
        'Review trust score thresholds for Sales Assistant'
      ]
    };

    return NextResponse.json({
      success: true,
      data: overseerData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overseer data' },
      { status: 500 }
    );
  }
}
