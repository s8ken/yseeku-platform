import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  
  const riskData = {
    tenant,
    timestamp: new Date().toISOString(),
    overallRiskScore: 23,
    trustScore: 87,
    complianceRate: 94.2,
    activeAlerts: 7,
    criticalViolations: 1,
    riskTrend: 'improving' as const,
    trustPrinciples: [
      { name: 'Consent Architecture', weight: 25, score: 85, critical: true },
      { name: 'Inspection Mandate', weight: 20, score: 92, critical: false },
      { name: 'Continuous Validation', weight: 20, score: 78, critical: false },
      { name: 'Ethical Override', weight: 15, score: 88, critical: true },
      { name: 'Right to Disconnect', weight: 10, score: 95, critical: false },
      { name: 'Moral Recognition', weight: 10, score: 82, critical: false }
    ],
    complianceReports: [
      { id: '1', title: 'EU AI Act Compliance', status: 'compliant', lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), score: 94 },
      { id: '2', title: 'GDPR Data Protection', status: 'compliant', lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), score: 96 },
      { id: '3', title: 'ISO 27001 Security', status: 'warning', lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), score: 87 },
      { id: '4', title: 'Trust Protocol Validation', status: 'compliant', lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), score: 91 }
    ],
    recentRiskEvents: [
      { 
        id: 'risk-001', 
        title: 'Low Trust Score Trend', 
        severity: 'warning', 
        description: 'Overall trust score decreased by 3% this week', 
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        resolved: false
      },
      { 
        id: 'risk-002', 
        title: 'Compliance Check Failed', 
        severity: 'error', 
        description: 'EU AI Act compliance check failed for agent deployment', 
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        resolved: false
      },
      { 
        id: 'risk-003', 
        title: 'Security Incident Detected', 
        severity: 'critical', 
        description: 'Unauthorized access attempt to trust protocol data', 
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        resolved: true
      }
    ],
    riskBreakdown: {
      operational: 18,
      compliance: 12,
      security: 25,
      ethical: 8
    },
    trends: {
      daily: [
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString().split('T')[0], score: 28 },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0], score: 26 },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0], score: 25 },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0], score: 24 },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0], score: 24 },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0], score: 23 },
        { date: new Date().toISOString().split('T')[0], score: 23 }
      ]
    }
  };
  
  return NextResponse.json({ success: true, data: riskData });
}
