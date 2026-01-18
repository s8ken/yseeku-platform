import { getPool, resolveTenantId } from './db';

export interface AuditLogInput {
  id: string;
  user_id?: string;
  event: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
}

export async function writeAuditLog(entry: AuditLogInput, tenantId?: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) {return false;}

  const tid = resolveTenantId(tenantId);

  await pool.query(
    `INSERT INTO audit_logs(id, user_id, event, status, details, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO NOTHING`,
    [
      entry.id,
      entry.user_id || null,
      entry.event,
      entry.status,
      JSON.stringify(entry.details || {}),
      tid,
    ]
  );
  return true;
}

export async function queryAuditLogs(tenantId?: string, limit: number = 100): Promise<any[]> {
  const pool = getPool();
  if (!pool) {return [];}

  const tid = resolveTenantId(tenantId);

  const res = await pool.query(
    `SELECT id, user_id, event, status, details, tenant_id, created_at FROM audit_logs WHERE (tenant_id = $1 OR $1 IS NULL) ORDER BY created_at DESC LIMIT $2`,
    [tid, limit]
  );
  return res.rows;
}
