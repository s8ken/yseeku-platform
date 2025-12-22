import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Env } from '@sonate/orchestrate'

export async function POST(req: Request) {
  const secret = Env.JWT_SECRET()
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || secret
  if (!secret) return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
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
    const roles = Array.isArray(payload.roles) ? payload.roles : ['operator']
    const token = jwt.sign({ sub: payload.sub, username: payload.username, roles, tenant_id: payload.tenant_id, type: 'access' }, secret, { expiresIn: '15m' })
    const res = NextResponse.json({ token })
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 900, path: '/' })
    res.cookies.set('auth_token', token, { httpOnly: false, sameSite: 'lax', secure: false, maxAge: 900, path: '/' })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

