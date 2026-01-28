import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const getJwtSecret = (): Uint8Array | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
};

async function authMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Skip auth for non-dashboard routes
  if (!pathname.startsWith('/dashboard')) {
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
    console.error('JWT_SECRET is not defined in environment');
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
