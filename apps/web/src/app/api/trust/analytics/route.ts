import { NextResponse } from 'next/server';

// Demo mode trust analytics endpoint
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';
    
    // Generate demo analytics data
    const analyticsData = {
      timeRange,
      data: {
        trustScores: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          score: 0.85 + Math.random() * 0.14,
          interactions: 20 + Math.floor(Math.random() * 40)
        })),
        principleBreakdown: {
          'Beneficence': 0.92 + Math.random() * 0.07,
          'Non-maleficence': 0.94 + Math.random() * 0.05,
          'Autonomy': 0.88 + Math.random() * 0.11,
          'Justice': 0.90 + Math.random() * 0.09,
          'Transparency': 0.87 + Math.random() * 0.12,
          'Accountability': 0.91 + Math.random() * 0.08
        },
        riskEvents: Array.from({ length: 5 }, (_, i) => ({
          id: `risk-${i}`,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          type: ['trust_violation', 'performance', 'security'][Math.floor(Math.random() * 3)],
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          resolved: Math.random() > 0.3
        })),
        compliance: {
          overall: 0.93 + Math.random() * 0.06,
          eu_ai_act: 0.95 + Math.random() * 0.04,
          gdpr: 0.98 + Math.random() * 0.02,
          industry_standards: 0.91 + Math.random() * 0.08
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData.data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
