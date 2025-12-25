import { NextRequest, NextResponse } from 'next/server';

const mockAuditTrails = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    userId: 'user-admin',
    userName: 'Admin User',
    event: 'agent.trust_score.updated',
    action: 'UPDATE',
    resource: 'Agent Trust Score',
    resourceId: 'agent-gpt4-001',
    status: 'success',
    details: {
      previousScore: 85,
      newScore: 87,
      reason: 'Improved ethical alignment metrics'
    },
    ipAddress: '192.168.1.1',
    tenantId: 'tenant-default'
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userId: 'user-admin',
    userName: 'Admin User',
    event: 'experiment.created',
    action: 'CREATE',
    resource: 'Experiment',
    resourceId: 'exp-003',
    status: 'success',
    details: {
      name: 'Multi-Modal Coherence Validation',
      hypothesis: 'Cross-modality coherence improves detection accuracy'
    },
    ipAddress: '192.168.1.1',
    tenantId: 'tenant-default'
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    userId: 'user-researcher',
    userName: 'Research User',
    event: 'receipt.verified',
    action: 'VERIFY',
    resource: 'Trust Receipt',
    resourceId: 'receipt-156',
    status: 'success',
    details: {
      verificationMethod: 'cryptographic',
      hashChainValid: true
    },
    ipAddress: '192.168.1.2',
    tenantId: 'tenant-research'
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userId: 'user-system',
    userName: 'System',
    event: 'compliance.check.completed',
    action: 'CHECK',
    resource: 'Compliance Report',
    resourceId: 'compliance-eu-ai-act',
    status: 'success',
    details: {
      framework: 'EU AI Act',
      score: 94,
      gaps: ['Article 13 documentation incomplete']
    },
    ipAddress: 'internal',
    tenantId: 'tenant-default'
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    userId: 'user-admin',
    userName: 'Admin User',
    event: 'tenant.settings.updated',
    action: 'UPDATE',
    resource: 'Tenant Settings',
    resourceId: 'tenant-enterprise',
    status: 'success',
    details: {
      setting: 'trustThreshold',
      previousValue: 70,
      newValue: 75
    },
    ipAddress: '192.168.1.1',
    tenantId: 'tenant-enterprise'
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    userId: 'user-researcher',
    userName: 'Research User',
    event: 'bedau.analysis.completed',
    action: 'ANALYZE',
    resource: 'Bedau Index',
    resourceId: 'bedau-session-42',
    status: 'success',
    details: {
      bedauIndex: 0.72,
      emergenceDetected: true,
      components: {
        weak: 0.68,
        strong: 0.45,
        observer: 0.82,
        intrinsic: 0.61
      }
    },
    ipAddress: '192.168.1.2',
    tenantId: 'tenant-research'
  },
  {
    id: 'audit-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    userId: 'user-system',
    userName: 'System',
    event: 'agent.drift.detected',
    action: 'ALERT',
    resource: 'Agent Monitoring',
    resourceId: 'agent-gpt4-001',
    status: 'warning',
    details: {
      driftScore: 0.23,
      threshold: 0.15,
      recommendation: 'Review agent behavior patterns'
    },
    ipAddress: 'internal',
    tenantId: 'tenant-default'
  }
];

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant');
  const action = request.nextUrl.searchParams.get('action');
  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
  
  let filteredTrails = [...mockAuditTrails];
  
  if (tenant && tenant !== 'all') {
    filteredTrails = filteredTrails.filter(t => t.tenantId === tenant);
  }
  
  if (action) {
    filteredTrails = filteredTrails.filter(t => t.action === action);
  }
  
  if (status) {
    filteredTrails = filteredTrails.filter(t => t.status === status);
  }
  
  const paginatedTrails = filteredTrails.slice(offset, offset + limit);
  
  const summary = {
    total: filteredTrails.length,
    byAction: {
      CREATE: filteredTrails.filter(t => t.action === 'CREATE').length,
      UPDATE: filteredTrails.filter(t => t.action === 'UPDATE').length,
      DELETE: filteredTrails.filter(t => t.action === 'DELETE').length,
      VERIFY: filteredTrails.filter(t => t.action === 'VERIFY').length,
      CHECK: filteredTrails.filter(t => t.action === 'CHECK').length,
      ANALYZE: filteredTrails.filter(t => t.action === 'ANALYZE').length,
      ALERT: filteredTrails.filter(t => t.action === 'ALERT').length
    },
    byStatus: {
      success: filteredTrails.filter(t => t.status === 'success').length,
      warning: filteredTrails.filter(t => t.status === 'warning').length,
      failure: filteredTrails.filter(t => t.status === 'failure').length
    }
  };
  
  return NextResponse.json({
    success: true,
    data: {
      trails: paginatedTrails,
      summary,
      pagination: {
        total: filteredTrails.length,
        offset,
        limit
      }
    }
  });
}
