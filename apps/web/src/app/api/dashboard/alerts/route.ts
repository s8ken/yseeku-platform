import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const u = new URL(req.url)
    const tenant = u.searchParams.get('tenant') || 'default'
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:3001'
    const res = await fetch(`${backend}/api/dashboard/alerts?tenant=${tenant}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || '',
        'x-tenant-id': tenant
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch alerts' }, { status: 500 })
  }
}
