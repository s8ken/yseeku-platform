import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { Env } from '@sonate/orchestrate';
import { upsertUser } from '@sonate/persistence';
import { withRateLimit } from '@/middleware/rate-limit';

const handler = async (req: Request) => {
  try {
    const body = await req.json();
    const { username, password, roles = ['operator'], tenant_id = 'default' } = body || {};
    const hdrTenant = req.headers.get('x-tenant-id') || undefined;
    const tenant = hdrTenant || tenant_id || 'default';
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    // Demo: accept any non-empty credentials; in production, validate via IdP or password store
    const secret = Env.JWT_SECRET();
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || secret;
    if (!secret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }
    const user = { id: `user_${username}`, username, email: `${username}@example.com`, roles, metadata: { tenant } };
    await upsertUser({ id: user.id, email: user.email, name: username });
    const token = jwt.sign({ sub: user.id, username, roles, tenant_id: tenant, type: 'access' }, secret, { expiresIn: '15m' });
    const refresh = jwt.sign({ sub: user.id, username, tenant_id: tenant, type: 'refresh' }, refreshSecret, { expiresIn: '7d' });
    const isProduction = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ success: true, data: { user, token, refresh, tenant } });
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 900, path: '/' });
    res.cookies.set('auth_token', token, { httpOnly: false, sameSite: 'lax', secure: isProduction, maxAge: 900, path: '/' });
    res.cookies.set('refresh_token', refresh, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 7*24*3600, path: '/' });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400 });
  }
}
