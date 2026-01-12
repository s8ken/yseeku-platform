import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@/lib/db';

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
  await ensureSchema();
  const pool = getPool();
  const tenant = request.nextUrl.searchParams.get('tenant');
  const action = request.nextUrl.searchParams.get('action');
  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
  if (!pool) {
    const demoEnabled = process.env.DEMO_ROUTES_ENABLED === 'true' || process.env.NODE_ENV !== 'production';
    if (!demoEnabled) {
      return NextResponse.json({
        success: true,
        data: { trails: [], summary: { total: 0, byAction: {}, byStatus: {} }, pagination: { total: 0, offset, limit } }
      });
    }
    const filteredTrails = [...mockAuditTrails].filter(t => {
      if (tenant && tenant !== 'all' && t.tenantId !== tenant) return false;
      if (action && t.action !== action) return false;
      if (status && t.status !== status) return false;
      return true;
    });
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
  const params: any[] = [];
  let where: string[] = [];
  if (tenant && tenant !== 'all') {
    params.push(tenant);
    where.push(`tenant_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    where.push(`action = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const q = `
    SELECT id, action, event, resource_type, resource_id, user_id, user_email, status, details, ip_address, tenant_id, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${Math.max(1, Math.min(limit, 1000))} OFFSET ${Math.max(0, offset)}
  `;
  const res = await pool.query(q, params);
  const rows = res.rows.map(r => ({
    id: r.id,
    timestamp: r.created_at,
    userId: r.user_id,
    userName: r.user_email || '',
    event: r.event,
    action: r.action,
    resource: r.resource_type,
    resourceId: r.resource_id,
    status: r.status,
    details: r.details || {},
    ipAddress: r.ip_address || '',
    tenantId: r.tenant_id
  }));
  const summary = {
    total: rows.length,
    byAction: {
      CREATE: rows.filter(t => t.action === 'CREATE').length,
      UPDATE: rows.filter(t => t.action === 'UPDATE').length,
      DELETE: rows.filter(t => t.action === 'DELETE').length,
      VERIFY: rows.filter(t => t.action === 'VERIFY').length,
      CHECK: rows.filter(t => t.action === 'CHECK').length,
      ANALYZE: rows.filter(t => t.action === 'ANALYZE').length,
      ALERT: rows.filter(t => t.action === 'ALERT').length
    },
    byStatus: {
      success: rows.filter(t => t.status === 'success').length,
      warning: rows.filter(t => t.status === 'warning').length,
      failure: rows.filter(t => t.status === 'failure').length
    }
  };
  return NextResponse.json({
    success: true,
    data: {
      trails: rows,
      summary,
      pagination: {
        total: rows.length,
        offset,
        limit
      }
    }
  });
}
