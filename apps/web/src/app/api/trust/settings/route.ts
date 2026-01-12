import { NextRequest, NextResponse } from 'next/server'
import { getPool, ensureSchema } from '@/lib/db'

export async function GET(request: NextRequest) {
  await ensureSchema()
  const pool = getPool()
  if (!pool) return NextResponse.json({ success: false, error: 'No database' }, { status: 500 })
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default'
  try {
    const res = await pool.query('SELECT settings FROM trust_settings WHERE tenant_id = $1 LIMIT 1', [tenant])
    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }
    return NextResponse.json({ success: true, data: res.rows[0].settings })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  await ensureSchema()
  const pool = getPool()
  if (!pool) return NextResponse.json({ success: false, error: 'No database' }, { status: 500 })
  try {
    const body = await request.json()
    const tenant = body.tenant_id || 'default'
    await pool.query(
      `INSERT INTO trust_settings (tenant_id, settings, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
      [tenant, JSON.stringify(body.settings || body)]
    )
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 })
  }
}

