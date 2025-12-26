import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { withRateLimit, rateLimiters } from '@/middleware/rate-limit';
import { getSecurityHeaders } from '@/middleware/auth-middleware';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const getJwtSecret = () => process.env.JWT_SECRET || '';

let pool: Pool | null = null;
function getPool(): Pool | null {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  pool = new Pool({ connectionString: url });
  return pool;
}

async function getUserByUsername(username: string) {
  const p = getPool();
  if (!p) return null;
  const result = await p.query(
    'SELECT id, email, name, password_hash FROM users WHERE id = $1',
    [username]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash };
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function upsertUser(user: { id: string; email?: string; name?: string }) {
  const p = getPool();
  if (!p) return false;
  await p.query(
    `INSERT INTO users(id, email, name) VALUES($1,$2,$3) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
    [user.id, user.email || null, user.name || null]
  );
  return true;
}

const handler = async (req: Request) => {
  try {
    const body = await req.json();
    const { username, password, roles = ['operator'], tenant_id = 'default' } = body || {};
    const hdrTenant = req.headers.get('x-tenant-id') || undefined;
    const tenant = hdrTenant || tenant_id || 'default';
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400, headers: getSecurityHeaders() });
    }

    // Get user from database
    const userRecord = await getUserByUsername(username);
    if (!userRecord || !userRecord.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: getSecurityHeaders() });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userRecord.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: getSecurityHeaders() });
    }

    const secret = getJwtSecret();
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || secret;
    if (!secret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500, headers: getSecurityHeaders() });
    }

    const user = {
      id: userRecord.id,
      username,
      email: userRecord.email || `${username}@example.com`,
      roles,
      metadata: { tenant }
    };

    // Update user if needed (roles might change)
    await upsertUser({ id: user.id, email: user.email, name: username });

    const token = jwt.sign({ sub: user.id, username, roles, tenant_id: tenant, type: 'access' }, secret, { expiresIn: '15m' });
    const refresh = jwt.sign({ sub: user.id, username, tenant_id: tenant, type: 'refresh' }, refreshSecret, { expiresIn: '7d' });
    const res = NextResponse.json({ success: true, data: { user, tenant }, token, refresh }, { headers: getSecurityHeaders() });
    res.cookies.set('session_token', token, { httpOnly: false, sameSite: 'none', secure: true, maxAge: 900, path: '/' });
    res.cookies.set('refresh_token', refresh, { httpOnly: false, sameSite: 'none', secure: true, maxAge: 7*24*3600, path: '/' });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400, headers: getSecurityHeaders() });
  }
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later'
});
