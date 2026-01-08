import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Env } from '@sonate/orchestrate/src/security/env-config'
import { ROLES } from '@/lib/auth'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  const secret = Env.JWT_SECRET()
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || secret
  if (!secret) return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=')
      return [name, rest.join('=')]
    })
  )
  const refresh = cookies.refresh_token || null
  if (!refresh) return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  try {
    const payload = jwt.verify(refresh, refreshSecret) as any
    if (payload.type !== 'refresh') return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
    const roles = Array.isArray(payload.roles) && payload.roles.length > 0 ? payload.roles : ['viewer']
    const primaryRole = String(roles[0] || 'viewer')
    const roleConfig = (ROLES as any)[primaryRole]
    const permissions: string[] = Array.isArray(roleConfig?.permissions) ? roleConfig.permissions : ['read']
    const token = jwt.sign(
      { sub: payload.sub, username: payload.username, roles, permissions, tenant_id: payload.tenant_id, type: 'access' },
      secret,
      { expiresIn: '15m', issuer: 'yseeku-platform', audience: 'yseeku-api' }
    )
    const res = NextResponse.json({ token })
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 900, path: '/' })
    res.cookies.set('auth_token', token, { httpOnly: false, sameSite: 'lax', secure: isProduction, maxAge: 900, path: '/' })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
