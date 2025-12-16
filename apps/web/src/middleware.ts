import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { Env } from '@sonate/orchestrate'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()
  const secret = Env.JWT_SECRET()
  if (!secret) return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
  const auth = req.headers.get('authorization')
  const cookieToken = req.cookies.get('session_token')?.value
  const token = auth && auth.startsWith('Bearer ') ? auth.substring(7) : cookieToken
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = jwt.verify(token, secret) as any
    const roles = Array.isArray(payload.roles) ? payload.roles : []
    if (roles.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.next()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/dashboard/:path*']
}
