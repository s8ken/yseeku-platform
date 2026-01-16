import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tenant = (req.headers.get('x-tenant-id') || 'default')
    const csrf = req.headers.get('x-csrf-token') || ''
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''
    
    console.log('Login attempt:', { username: body.username, tenant, hasBackendUrl: !!backendUrl })
    
    if (backendUrl) {
      try {
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
        console.log('Backend login response:', { status: res.status, success: data.success })
        return NextResponse.json(data, { status: res.status })
      } catch (backendError) {
        console.log('Backend login failed, falling back to local auth:', backendError)
        // Continue to local fallback
      }
    }
    
    // Local fallback authentication
    const isAdmin = String(body.username).toLowerCase() === 'admin@yseeku.com' || String(body.username).toLowerCase() === 'admin'
    const isDemo = String(body.username).toLowerCase() === 'demo@yseeku.com' || String(body.username).toLowerCase() === 'demo'
    
    console.log('Local auth check:', { isAdmin, isDemo, username: body.username.toLowerCase() })
    
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        data: {
          user: { id: 'admin-local', username: 'Admin', email: 'admin@yseeku.com', roles: ['admin'], metadata: { tenant: 'default' } },
          tenant: 'default',
          note: 'Using local fallback - for full backend access, register at: /api/auth/register or use credentials: admin@yseeku.com / Admin123!'
        }
      }, { status: 200 })
    }
    
    if (isDemo) {
      return NextResponse.json({
        success: true,
        data: {
          user: { id: 'demo-local', username: 'Demo', email: 'demo@yseeku.com', roles: ['user'], metadata: { tenant: 'default' } },
          tenant: 'default',
          note: 'Using local fallback - for full backend access, register at: /api/auth/register or use credentials: demo@yseeku.com / Demo123!'
        }
      }, { status: 200 })
    }
    
    console.log('Login failed for username:', body.username)
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 401 })
  } catch (error) {
    console.error('Login route error:', error)
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 401 })
  }
}
