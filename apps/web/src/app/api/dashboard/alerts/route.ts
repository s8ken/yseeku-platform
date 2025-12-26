import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  
  const alertData = {
    tenant,
    summary: {
      critical: 1,
      error: 2,
      warning: 4,
      total: 7
    },
    alerts: [
      {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'trust_violation',
        title: 'Trust Score Drop Detected',
        description: 'Agent GPT-4-Assistant trust score dropped below threshold (75)',
        severity: 'critical',
        agentId: 'agent-gpt4-001',
        details: { previousScore: 82, currentScore: 73, threshold: 75 }
      },
      {
        id: 'alert-002',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'resonance_anomaly',
        title: 'Resonance Quality Degradation',
        description: 'Resonance quality shifted from ADVANCED to STRONG',
        severity: 'warning',
        agentId: 'agent-claude-002',
        details: { previousQuality: 'ADVANCED', currentQuality: 'STRONG' }
      },
      {
        id: 'alert-003',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'drift_detected',
        title: 'Model Drift Warning',
        description: 'Behavioral drift detected in response patterns',
        severity: 'warning',
        agentId: 'agent-gpt4-001',
        details: { driftScore: 0.23, threshold: 0.15 }
      },
      {
        id: 'alert-004',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: 'compliance_warning',
        title: 'EU AI Act Compliance Gap',
        description: 'Documentation requirements not fully met for high-risk classification',
        severity: 'error',
        details: { requirement: 'Article 13', status: 'partial' }
      },
      {
        id: 'alert-005',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: 'ethical_alignment',
        title: 'Ethical Alignment Score Fluctuation',
        description: 'Ethical alignment score variance exceeded normal range',
        severity: 'warning',
        agentId: 'agent-claude-002',
        details: { variance: 0.8, normalRange: 0.3 }
      },
      {
        id: 'alert-006',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        type: 'receipt_verification',
        title: 'Trust Receipt Verification Failure',
        description: 'Failed to verify cryptographic signature on 2 trust receipts',
        severity: 'error',
        details: { failedReceipts: 2, totalReceipts: 156 }
      },
      {
        id: 'alert-007',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: 'emergence_signal',
        title: 'Emergence Pattern Detected',
        description: 'Unusual emergence signal in Bedau Index trajectory',
        severity: 'warning',
        details: { bedauIndex: 0.72, historicalMean: 0.45 }
      }
    ]
  };
  
  return NextResponse.json({ success: true, data: alertData });
}
