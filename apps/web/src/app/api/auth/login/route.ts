import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { Env } from '@sonate/orchestrate';
import { upsertUser, getUserByUsername, verifyPassword, hashPassword } from '@sonate/persistence';
import { withRateLimit, rateLimiters } from '@/middleware/rate-limit';
import { getSecurityHeaders } from '@/middleware/auth-middleware';

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

    const secret = Env.JWT_SECRET();
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
    const isProduction = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ success: true, data: { user, tenant } }, { headers: getSecurityHeaders() });
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 900, path: '/' });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 7*24*3600, path: '/' });
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
