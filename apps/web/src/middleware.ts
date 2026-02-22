import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const getJwtSecret = (): Uint8Array | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
};

const BACKEND_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://127.0.0.1:3001';

async function authMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Skip auth for non-dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Skip auth for overseer dashboard (public analytics)
  if (pathname.startsWith('/dashboard/overseer')) {
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  const cookieToken = req.cookies.get('session_token')?.value;
  const BEARER_PREFIX_LENGTH = 7;
  const token = auth && auth.startsWith('Bearer ') ? auth.substring(BEARER_PREFIX_LENGTH) : cookieToken;

  // If no token, redirect to login immediately
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  const secret = getJwtSecret();
  if (!secret) {
    // Fallback: verify token with backend to avoid coupling secrets to frontend env
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (resp.ok) {
        return NextResponse.next();
      }
    } catch {}
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token invalid, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
}

export const middleware = authMiddleware;

export const config = {
  matcher: ['/dashboard/:path*']
};
