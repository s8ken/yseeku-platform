import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tenant = (req.headers.get('x-tenant-id') || 'default')
    const csrf = req.headers.get('x-csrf-token') || ''
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
    if (backendUrl) {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant,
          'x-csrf-token': csrf,
        },
        body: JSON.stringify({ username: body.username, password: body.password })
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }
    const isAdmin = String(body.username).toLowerCase() === 'admin@yseeku.com' || String(body.username).toLowerCase() === 'admin'
    const isDemo = String(body.username).toLowerCase() === 'demo@yseeku.com' || String(body.username).toLowerCase() === 'demo'
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        data: {
          user: { id: 'admin-local', username: 'Admin', email: 'admin@yseeku.com', roles: ['admin'], metadata: { tenant: 'default' } },
          tenant: 'default'
        }
      }, { status: 200 })
    }
    if (isDemo) {
      return NextResponse.json({
        success: true,
        data: {
          user: { id: 'demo-local', username: 'Demo', email: 'demo@yseeku.com', roles: ['user'], metadata: { tenant: 'default' } },
          tenant: 'default'
        }
      }, { status: 200 })
    }
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 401 })
  }
}
