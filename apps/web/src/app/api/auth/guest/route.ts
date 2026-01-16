import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:3001'
    const res = await fetch(`${backend}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ success: false, message: 'Guest login failed' }, { status: 500 })
  }
}
