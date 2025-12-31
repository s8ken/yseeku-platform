import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { Env } from '@sonate/orchestrate'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const revoked = new Set<string>()

export async function POST(req: Request) {
  const secret = Env.JWT_SECRET()
  if (!secret) return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 })
  const token = extractToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let payload: any
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasRole(payload, ['guardian','auditor'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const selfHash = String(body?.self_hash || '')
    if (!selfHash) return NextResponse.json({ error: 'Missing self_hash' }, { status: 400 })
    revoked.add(selfHash)
    return NextResponse.json({ revoked: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400 })
  }
}

