import { NextResponse } from 'next/server'
import { hasState, delState } from '../../../../../lib/oidc-state'
import jwt from 'jsonwebtoken'
import { Env } from '@sonate/orchestrate'
import { getOidcConfig } from '../../../../../lib/oidc-providers'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cfg = getOidcConfig()
  const secret = Env.JWT_SECRET()
  if (!code || !state) return NextResponse.json({ error: 'Invalid OIDC response' }, { status: 400 })
  if (!hasState(state)) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  if (!cfg || !secret) {
    return NextResponse.json({ error: 'OIDC not configured' }, { status: 501 })
  }
  try {
    const body = new URLSearchParams()
    body.set('grant_type', 'authorization_code')
    body.set('code', code)
    body.set('redirect_uri', cfg.redirectUri)
    body.set('client_id', cfg.clientId)
    body.set('client_secret', cfg.clientSecret)
    const res = await fetch(cfg.tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
    if (!res.ok) return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 })
    const tok = await res.json() as any
    const id = tok.id_token || ''
    const user = { id: `oidc_${Date.now()}`, username: 'oidc', roles: ['viewer'], tenant_id: 'default' }
    const appToken = jwt.sign({ sub: user.id, username: user.username, roles: user.roles, tenant_id: user.tenant_id }, secret, { expiresIn: '1h' })
    delState(state)
    const response = NextResponse.json({ token: appToken, user })
    response.cookies.set('session_token', appToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 3600 })
    return response
  } catch (e) {
    return NextResponse.json({ error: 'OIDC error' }, { status: 400 })
  }
}
