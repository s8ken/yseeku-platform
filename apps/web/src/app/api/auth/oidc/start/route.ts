import { NextResponse } from 'next/server'
import { Env } from '@sonate/orchestrate'
import { getOidcConfig } from '../../../../../lib/oidc-providers'
import crypto from 'crypto'
import { putState } from '../../../../../lib/oidc-state'

export async function GET() {
  const cfg = getOidcConfig()
  if (!cfg) return NextResponse.json({ error: 'OIDC not configured' }, { status: 501 })
  const state = crypto.randomBytes(16).toString('hex')
  putState(state)
  const url = new URL(cfg.authUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', cfg.redirectUri)
  url.searchParams.set('scope', 'openid profile email')
  url.searchParams.set('state', state)
  return NextResponse.redirect(url.toString())
}
