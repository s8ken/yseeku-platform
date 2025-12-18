import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenant = url.searchParams.get('tenant') || 'default';
  const now = new Date().toISOString();
  const data = {
    tenant,
    timestamp: now,
    trustScore: 87,
    principleScores: {
      CONSENT_ARCHITECTURE: 88,
      INSPECTION_MANDATE: 90,
      CONTINUOUS_VALIDATION: 82,
      ETHICAL_OVERRIDE: 85,
      RIGHT_TO_DISCONNECT: 93,
      MORAL_RECOGNITION: 80,
    },
    totalInteractions: 1423,
    activeAgents: 27,
    complianceRate: 92,
    riskScore: 14,
    alertsCount: 3,
    experimentsRunning: 2,
  };
  return NextResponse.json({ success: true, data });
}

