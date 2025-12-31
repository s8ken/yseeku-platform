import { getPool } from './db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
  tenant_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export const ROLES = {
  admin: {
    name: 'Admin',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_tenants', 'view_audit', 'manage_experiments']
  },
  analyst: {
    name: 'Analyst', 
    permissions: ['read', 'write', 'view_audit', 'manage_experiments']
  },
  viewer: {
    name: 'Viewer',
    permissions: ['read']
  }
};

const BCRYPT_ROUNDS = 12;

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || hash.length < 20) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function createSession(userId: string, expiresInHours: number = 24): Promise<Session | null> {
  const pool = getPool();
  if (!pool) return null;
  
  const id = generateId('session');
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  try {
    await pool.query(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`,
      [id, userId, token, expiresAt]
    );
    
    return {
      id,
      user_id: userId,
      token,
      expires_at: expiresAt,
      created_at: new Date()
    };
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

export async function validateSession(token: string): Promise<User | null> {
  const pool = getPool();
  if (!pool) return null;
  
  try {
    const sessionResult = await pool.query(
      `SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.tenant_id
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    
    if (sessionResult.rows.length === 0) return null;
    
    const row = sessionResult.rows[0];
    return {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role || 'viewer',
      tenant_id: row.tenant_id
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

export async function deleteSession(token: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  
  try {
    const result = await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

export async function cleanExpiredSessions(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  
  try {
    const result = await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning sessions:', error);
    return 0;
  }
}

export function hasPermission(user: User, permission: string): boolean {
  const roleConfig = ROLES[user.role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

export function hasPermissionByRole(role: string, permission: string): boolean {
  const roleConfig = ROLES[role as keyof typeof ROLES];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

export async function ensureDefaultAdmin(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminPassword || !adminEmail) {
    console.warn('ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set. Admin provisioning skipped.');
    return;
  }
  
  if (adminPassword.length < 12) {
    console.warn('ADMIN_PASSWORD must be at least 12 characters for security. Admin provisioning skipped.');
    return;
  }
  
  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [adminEmail]);
    
    if (result.rows.length === 0) {
      const id = generateId('user');
      const passwordHash = await hashPassword(adminPassword);
      
      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, role, tenant_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, adminEmail, 'Admin User', passwordHash, 'admin', 'default']
      );
      console.log('Admin user created from environment variables');
    } else if (!result.rows[0].password_hash || result.rows[0].password_hash.length < 20) {
      const passwordHash = await hashPassword(adminPassword);
      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE email = $2`,
        [passwordHash, adminEmail]
      );
      console.log('Admin password hash upgraded to bcrypt');
    }
  } catch (error) {
    console.error('Error ensuring admin:', error);
  }
}

export async function auditLog(
  userId: string,
  event: string,
  status: 'success' | 'failure',
  details: object,
  tenantId: string = 'default'
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, event, status, details, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [generateId('audit'), userId, event, status, JSON.stringify(details), tenantId]
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}
