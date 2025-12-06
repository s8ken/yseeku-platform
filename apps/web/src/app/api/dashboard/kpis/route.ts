import { NextRequest, NextResponse } from 'next/server';
import { SymbiScorer, TrustProtocol, TrustScore } from '@sonate/core';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Instantiate core classes
    const scorer = new SymbiScorer();
    const protocol = new TrustProtocol();

    // Generate mock interaction context for demo purposes
    const mockContext = {
      userId: 'demo-user',
      agentId: 'demo-agent',
      sessionId: 'demo-session',
      timestamp: Date.now(),
      userConsent: true,
      dataInspection: true,
      validationChecks: 5,
      ethicalFlags: 0,
      disconnectRequests: 0,
      moralAlignment: 8,
      tenant
    };

    // Score the interaction
    const trustScore: TrustScore = scorer.scoreInteraction(mockContext);

    // Additional KPI calculations
    const totalInteractions = 1250;
    const activeAgents = 45;
    const complianceRate = 98.5;
    const riskScore = 100 - trustScore.totalScore; // Inverse relationship

    const kpis = {
      tenant,
      timestamp: new Date().toISOString(),
      trustScore: trustScore.totalScore,
      principleScores: trustScore.principleScores,
      totalInteractions,
      activeAgents,
      complianceRate,
      riskScore,
      alertsCount: 3, // Mock alerts count
      experimentsRunning: 7,
      orchestratorsActive: 12
    };

    return NextResponse.json({
      success: true,
      data: kpis
    });

  } catch (error) {
    console.error('KPIs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}