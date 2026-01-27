import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withMonitoring, logAuthAttempt } from './middleware/monitoring-middleware';

const getJwtSecret = (): string => process.env.JWT_SECRET ?? '';

function authMiddleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // Skip auth for non-dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }
  
  // For dashboard pages, allow access - client-side will handle auth
  // This is needed because cookies don't work reliably in iframe environments
  // The dashboard components will check localStorage for the token
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
    // If secret is missing, fail open or closed? Closed is safer for enterprise.
    console.error('JWT_SECRET is not defined in environment');
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    logAuthAttempt(true, payload.sub ?? 'unknown', 'success');
    return NextResponse.next();
  } catch (error) {
    // Token invalid, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
}

export const middleware = withMonitoring(authMiddleware, {
  logRequests: true,
  logErrors: true,
  recordMetrics: true
})

export const config = {
  matcher: ['/dashboard/:path*']
}
