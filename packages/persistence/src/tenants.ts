import { getPool } from './db';

export interface Tenant {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended';
  compliance_status: 'compliant' | 'warning' | 'non-compliant';
  trust_score: number;
  created_at: Date;
  last_activity: Date;
}

export interface CreateTenantInput {
  name: string;
  description?: string;
}

function generateId(): string {
  return `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant | null> {
  const pool = getPool();
  if (!pool) return null;
  
  const id = generateId();
  const now = new Date();
  
  await pool.query(
    `INSERT INTO tenants (id, name, description, status, compliance_status, trust_score, created_at, last_activity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, input.name, input.description || '', 'active', 'compliant', 85, now, now]
  );
  
  return {
    id,
    name: input.name,
    description: input.description || '',
    status: 'active',
    compliance_status: 'compliant',
    trust_score: 85,
    created_at: now,
    last_activity: now
  };
}

export async function getTenants(): Promise<Tenant[]> {
  const pool = getPool();
  if (!pool) return [];
  
  const res = await pool.query(
    `SELECT id, name, description, status, compliance_status, trust_score, created_at, last_activity 
     FROM tenants ORDER BY created_at DESC`
  );
  
  return res.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    compliance_status: row.compliance_status,
    trust_score: row.trust_score,
    created_at: row.created_at,
    last_activity: row.last_activity
  }));
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const pool = getPool();
  if (!pool) return null;
  
  const res = await pool.query(
    `SELECT id, name, description, status, compliance_status, trust_score, created_at, last_activity 
     FROM tenants WHERE id = $1`,
    [id]
  );
  
  if (res.rows.length === 0) return null;
  
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    compliance_status: row.compliance_status,
    trust_score: row.trust_score,
    created_at: row.created_at,
    last_activity: row.last_activity
  };
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const pool = getPool();
  if (!pool) return null;
  
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.compliance_status !== undefined) {
    fields.push(`compliance_status = $${idx++}`);
    values.push(updates.compliance_status);
  }
  if (updates.trust_score !== undefined) {
    fields.push(`trust_score = $${idx++}`);
    values.push(updates.trust_score);
  }
  
  fields.push(`last_activity = $${idx++}`);
  values.push(new Date());
  
  if (fields.length === 0) return getTenantById(id);
  
  values.push(id);
  await pool.query(
    `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  );
  
  return getTenantById(id);
}

export async function deleteTenant(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  
  const res = await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
  return res.rowCount > 0;
}

export async function getTenantUserCount(tenantId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  
  const res = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
    [tenantId]
  );
  
  return parseInt(res.rows[0]?.count || '0', 10);
}
