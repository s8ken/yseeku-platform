import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()
  // In development/UAT, skip strict auth checks to prevent Edge JWT issues
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }
  const auth = req.headers.get('authorization')
  const cookieToken = req.cookies.get('session_token')?.value || req.cookies.get('auth_token')?.value
  const token = auth && auth.startsWith('Bearer ') ? auth.substring(7) : cookieToken
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
