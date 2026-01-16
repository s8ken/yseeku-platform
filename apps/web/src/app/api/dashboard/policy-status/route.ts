import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:3001'
    const res = await fetch(`${backend}/api/dashboard/policy-status`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || ''
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch policy status' }, { status: 500 })
  }
}
