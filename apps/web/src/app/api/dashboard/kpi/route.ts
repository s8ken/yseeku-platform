import { NextResponse } from 'next/server';

// Demo mode KPI endpoint for dashboard
export async function GET() {
  try {
    const kpiData = {
      tenant: 'demo',
      timestamp: new Date().toISOString(),
      trustScore: 0.91 + Math.random() * 0.08,
      principleScores: {
        'Beneficence': 0.92 + Math.random() * 0.07,
        'Non-maleficence': 0.94 + Math.random() * 0.05,
        'Autonomy': 0.88 + Math.random() * 0.11,
        'Justice': 0.90 + Math.random() * 0.09,
        'Transparency': 0.87 + Math.random() * 0.12,
        'Accountability': 0.91 + Math.random() * 0.08
      },
      totalInteractions: 1250 + Math.floor(Math.random() * 500),
      activeAgents: 3,
      avgResponseTime: 1.2 + Math.random() * 0.8,
      complianceRate: 0.93 + Math.random() * 0.06,
      riskEvents: Math.floor(Math.random() * 5),
      uptime: 0.998,
      alerts: [
        {
          id: 'alert-1',
          type: 'warning',
          message: 'Low resonance detected in Sales Assistant',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 'alert-2', 
          type: 'info',
          message: 'Compliance report ready for review',
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: kpiData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}
