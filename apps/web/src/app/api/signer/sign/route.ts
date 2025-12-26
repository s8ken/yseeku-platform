import { NextResponse } from 'next/server'
import { getDefaultSigner, bindingMessage } from '@sonate/orchestrate/src/security/signer'
import { Env } from '@sonate/orchestrate'
import jwt from 'jsonwebtoken'

function extractToken(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.substring(7)
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [name, ...rest] = c.trim().split('=')
        return [name, rest.join('=')]
      })
    )
    return cookies.session_token || cookies.auth_token || null
  }
  return null
}

function hasRole(payload: any, roles: string[]): boolean {
  const userRoles: string[] = (payload?.roles || []).map((r: any) => String(r))
  return roles.some(r => userRoles.includes(r))
}

const NONCE_TTL_MS = 300_000
const usedNonces = new Map<string, number>()

export async function POST(req: Request) {
  const secret = Env.JWT_SECRET()
  if (!secret) return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
  const token = extractToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let payload: any
  try {
    payload = jwt.verify(token, secret)
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasRole(payload, ['operator','guardian'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const selfHashHex = String(body?.self_hash || '')
    const sessionId = String(body?.session_id || '')
    const sessionNonce = String(body?.session_nonce || '')
    const timestamp = Number(body?.timestamp || 0)
    if (!selfHashHex || !sessionId || !sessionNonce || !timestamp) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const now = Date.now()
    if (Math.abs(now - timestamp) > NONCE_TTL_MS) {
      return NextResponse.json({ error: 'Expired payload' }, { status: 400 })
    }
    const key = `${sessionId}:${sessionNonce}`
    const seen = usedNonces.get(key) || 0
    if (seen && now - seen < NONCE_TTL_MS) {
      return NextResponse.json({ error: 'Replay detected' }, { status: 409 })
    }
    usedNonces.set(key, now)

    const signer = getDefaultSigner()
    const msg = bindingMessage({ selfHashHex, sessionId, sessionNonce })
    const sig = await signer.sign(msg)
    return NextResponse.json({ signature_hex: sig.signatureHex, signature_base64: sig.signatureBase64 })
  } catch (err) {
    return NextResponse.json({ error: 'Sign error', message: (err as Error).message }, { status: 400 })
  }
}

