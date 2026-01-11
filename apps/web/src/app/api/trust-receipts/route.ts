import { NextRequest, NextResponse } from 'next/server'
import { getPool, ensureSchema } from '@/lib/db'

export async function GET(request: NextRequest) {
  await ensureSchema()
  const pool = getPool()

  if (!pool) {
    return NextResponse.json({ success: true, data: [], source: 'none' })
  }

  try {
    const { searchParams } = new URL(request.url)
    const hashParam = searchParams.get('hash')
    const tenant = searchParams.get('tenant')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (hashParam) {
      const normalized = hashParam.startsWith('0x') ? hashParam.slice(2) : hashParam
      const res = await pool.query(
        `SELECT self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id, created_at 
         FROM trust_receipts WHERE self_hash = $1 LIMIT 1`,
        [normalized]
      )

      if (res.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 })
      }

      const row = res.rows[0]
      const ciq = row.ciq || {}
      const trustScore = ciq.trust_score || 0
      const symbiDimensions = ciq.symbi_dimensions || {}

      return NextResponse.json({
        success: true,
        data: {
          verified: true,
          receiptHash: row.self_hash,
          trustScore,
          symbiDimensions,
          timestamp: row.timestamp || row.created_at,
          signature: row.signature || null,
        },
        source: 'database',
      })
    }

    const params: any[] = []
    let query = `SELECT self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id, created_at 
                 FROM trust_receipts`
    if (tenant) {
      query += ' WHERE tenant_id = $1'
      params.push(tenant)
    }
    query += ' ORDER BY created_at DESC LIMIT ' + Math.max(1, Math.min(limit, 1000))

    const result = await pool.query(query, params)

    const stats = {
      total: result.rows.length,
      verified: result.rows.length,
      invalid: 0,
      chainLength: result.rows.length,
    }

    return NextResponse.json({ success: true, data: result.rows, stats, source: 'database' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
