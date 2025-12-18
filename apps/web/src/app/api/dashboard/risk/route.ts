import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenant = url.searchParams.get('tenant') || 'default';
  const data = {
    overallRiskScore: 15,
    trustScore: 87,
    complianceRate: 93,
    activeAlerts: 3,
    criticalViolations: 1,
    riskTrend: 'stable' as const,
  };
  return NextResponse.json({ success: true, data: { tenant, ...data } });
}

