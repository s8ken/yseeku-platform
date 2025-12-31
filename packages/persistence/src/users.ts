import { getPool, resolveTenantId } from './db';
import bcrypt from 'bcrypt';

export interface UserRecord {
  id: string;
  email?: string;
  name?: string;
  passwordHash?: string;
  tenantId?: string;
}

export async function upsertUser(user: UserRecord): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  
  const tid = resolveTenantId(user.tenantId);
  
  await pool.query(
    `INSERT INTO users(id, email, name, password_hash, tenant_id)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, tenant_id = EXCLUDED.tenant_id`,
    [user.id, user.email || null, user.name || null, user.passwordHash || null, tid]
  );
  return true;
}

export async function getUserByUsername(username: string, tenantId?: string): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  
  const tid = resolveTenantId(tenantId);
  
  const result = await pool.query(
    'SELECT id, email, name, password_hash, tenant_id FROM users WHERE id = $1 AND (tenant_id = $2 OR $2 IS NULL)',
    [username, tid]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
