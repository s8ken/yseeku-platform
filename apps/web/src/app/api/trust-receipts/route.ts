import { NextRequest, NextResponse } from 'next/server'
import { getPool, ensureSchema } from '@/lib/db'

export async function GET(request: NextRequest) {
  await ensureSchema()
  const pool = getPool()

  if (!pool) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const result = await pool.query(
      `SELECT self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id, created_at 
       FROM trust_receipts ORDER BY created_at DESC LIMIT 50`
    )
    return NextResponse.json({ success: true, data: result.rows })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

