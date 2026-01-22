import { NextRequest } from 'next/server';

export function GET(_request: NextRequest): Response {
  // Return default KPI structure
  const kpis = {
    trustScore: 0,
    activeAgents: 0,
    totalInteractions: 0,
    complianceRate: 0,
    riskScore: 0,
    alertsCount: 0,
    experimentsRunning: 0,
    orchestratorsActive: 0,
    principleScores: {
      transparency: 0,
      fairness: 0,
      privacy: 0,
      safety: 0,
      accountability: 0,
    },
    sonateDimensions: {
      realityIndex: 0,
      trustProtocol: 'PENDING',
      ethicalAlignment: 0,
      resonanceQuality: 'PENDING',
      canvasParity: 0,
    },
    trends: {
      trustScore: { change: 0, direction: 'stable' },
    },
  };

  return new Response(
    JSON.stringify({ success: true, data: kpis }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}
