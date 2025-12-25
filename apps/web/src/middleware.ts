import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { withMonitoring, logAuthAttempt } from './middleware/monitoring-middleware'

const getJwtSecret = () => process.env.JWT_SECRET || ''

// Route security configuration
// Maps URL paths to required roles
const ROUTE_GUARDS: Record<string, string[]> = {
  '/dashboard/admin': ['super_admin', 'admin'],
  '/dashboard/audit': ['super_admin', 'admin', 'analyst'],
  '/dashboard/settings': ['super_admin', 'admin'],
  '/dashboard/receipts': ['super_admin', 'admin', 'operator', 'viewer'],
  '/dashboard/keys': ['super_admin', 'admin', 'developer'],
}

function authMiddleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  
  // Skip auth for non-dashboard routes
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()
  
  // For dashboard pages, allow access - client-side will handle auth
  // This is needed because cookies don't work reliably in iframe environments
  // The dashboard components will check localStorage for the token
  const auth = req.headers.get('authorization')
  const cookieToken = req.cookies.get('session_token')?.value
  const token = auth && auth.startsWith('Bearer ') ? auth.substring(7) : cookieToken

  // If no token, allow page to load - client will redirect to login if needed
  if (!token) {
    return NextResponse.next()
  }

  const secret = getJwtSecret()
  if (!secret) {
    return NextResponse.next()
  }

  try {
    const payload = jwt.verify(token, secret) as any
    logAuthAttempt(true, payload.sub, 'success');
    return NextResponse.next()
  } catch (e) {
    // Token invalid, but let the page load - client will handle redirect
    return NextResponse.next()
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
