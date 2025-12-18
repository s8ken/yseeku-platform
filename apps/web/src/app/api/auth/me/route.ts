import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import jwt from 'jsonwebtoken';
import { Env } from '@sonate/orchestrate';

function extractToken(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.substring(7);
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [name, ...rest] = c.trim().split('=');
        return [name, rest.join('=')];
      })
    );
    return cookies.session_token || cookies.auth_token || null;
  }
  return null;
}

export async function GET(req: Request) {
  const secret = Env.JWT_SECRET();
  if (!secret) {
    return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
  }
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = jwt.verify(token, secret) as any;
    return NextResponse.json({ user: { id: payload.sub, username: payload.username, roles: payload.roles, tenant_id: payload.tenant_id } });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized', message: (err as Error).message }, { status: 401 });
  }
}
