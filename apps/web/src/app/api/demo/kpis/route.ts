import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return stable demo KPI data
    return NextResponse.json({
      success: true,
      data: {
        tenant: 'demo-tenant',
        timestamp: new Date().toISOString(),
        trustScore: 7.2,
        principleScores: {
          consent: 8.1,
          inspection: 7.5,
          validation: 6.8,
          override: 7.0,
          disconnect: 7.3,
          recognition: 7.1,
        },
        totalInteractions: 4823,
        activeAgents: 12,
        complianceRate: 94,
        riskScore: 2.1,
        alertsCount: 18,
        experimentsRunning: 3,
        orchestratorsActive: 5,
        sonateDimensions: {
          trustProtocol: 'SYMBI v3.2',
          ethicalAlignment: 8.7,
          resonanceQuality: 'OPTIMAL',
          realityIndex: 0,
          canvasParity: 0,
        },
        trends: {
          trustScore: { change: 2.3, direction: 'up' },
          interactions: { change: 5.1, direction: 'up' },
          compliance: { change: 1.2, direction: 'up' },
          risk: { change: -0.8, direction: 'down' },
        },
        bedau: {
          index: 0.83,
          type: 'HIGH_WEAK_EMERGENCE' as const,
          confidenceInterval: [0.78, 0.88],
          kolmogorovComplexity: 4287,
        },
      }
    });
  } catch (error) {
    console.error('Demo KPIs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo KPIs' },
      { status: 500 }
    );
  }
}
