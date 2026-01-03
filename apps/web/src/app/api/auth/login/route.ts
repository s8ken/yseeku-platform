import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import jwt from 'jsonwebtoken';
import { withRateLimit } from '@/middleware/rate-limit';
import { getSecurityHeaders } from '@/middleware/auth-middleware';
import { getPool } from '@/lib/db';
import { verifyPassword, createSession, auditLog, ensureDefaultAdmin, ROLES } from '@/lib/auth';
import { verifyCsrfToken, csrfErrorResponse } from '@/lib/csrf';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

async function getUserByUsername(username: string) {
  const p = getPool();
  if (!p) return null;
  
  const result = await p.query(
    'SELECT id, email, name, password_hash, role, tenant_id FROM users WHERE id = $1 OR email = $1 OR LOWER(name) = LOWER($1)',
    [username]
  );
  
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { 
    id: row.id, 
    email: row.email, 
    name: row.name, 
    passwordHash: row.password_hash,
    role: row.role || 'viewer',
    tenant_id: row.tenant_id || 'default'
  };
}

const handler = async (req: NextRequest) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const isValidCsrf = await verifyCsrfToken(req);
      if (!isValidCsrf) {
        return csrfErrorResponse();
      }
    }
    
    await ensureDefaultAdmin();
    console.log('Post-ensureDefaultAdmin check...');
    
    const body = await req.json();
    const { username, password, tenant_id = 'default' } = body || {};
    const hdrTenant = req.headers.get('x-tenant-id') || undefined;
    const tenant = hdrTenant || tenant_id || 'default';
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400, headers: getSecurityHeaders() });
    }

    console.log(`Login attempt for username: ${username} on tenant: ${tenant}`);
    const userRecord = await getUserByUsername(username);
    
    if (!userRecord) {
      console.log(`User not found in database for identifier: ${username}`);
      await auditLog('anonymous', 'login_failed', 'failure', { username, reason: 'user_not_found' }, tenant);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: getSecurityHeaders() });
    }

    console.log(`User found: ${userRecord.id} (${userRecord.email}), role: ${userRecord.role}`);

    if (!userRecord.passwordHash) {
      console.log(`User found but has no password hash: ${username}`);
      await auditLog('anonymous', 'login_failed', 'failure', { username, reason: 'missing_password_hash' }, tenant);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: getSecurityHeaders() });
    }

    const isPasswordValid = await verifyPassword(password, userRecord.passwordHash);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      await auditLog(userRecord.id, 'login_failed', 'failure', { username, reason: 'invalid_password' }, tenant);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: getSecurityHeaders() });
    }

    console.log(`Login successful for user: ${username}`);

    const secret = getJwtSecret();
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || secret;

    const userRole = userRecord.role || 'viewer';
    const roleConfig = ROLES[userRole as keyof typeof ROLES];
    const permissions = roleConfig?.permissions || ['read'];
    
    const user = {
      id: userRecord.id,
      username,
      email: userRecord.email,
      name: userRecord.name || username,
      role: userRole,
      roles: [userRole],
      permissions,
      metadata: { tenant }
    };
    
    const dbSession = await createSession(user.id, 24);

    const token = jwt.sign({ 
      sub: user.id, 
      username, 
      role: userRole,
      roles: [userRole],
      permissions,
      tenant_id: tenant, 
      type: 'access',
      session_id: dbSession?.id
    }, secret, { expiresIn: '24h' });
    
    const refresh = jwt.sign({ 
      sub: user.id, 
      username, 
      tenant_id: tenant, 
      type: 'refresh' 
    }, refreshSecret, { expiresIn: '7d' });
    
    await auditLog(user.id, 'login_success', 'success', { username, role: userRole }, tenant);
    
    const res = NextResponse.json({ 
      success: true, 
      data: { user, tenant }
    }, { headers: getSecurityHeaders() });
    
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 24 * 3600, path: '/' });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 7 * 24 * 3600, path: '/' });
    
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400, headers: getSecurityHeaders() });
  }
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later'
});
