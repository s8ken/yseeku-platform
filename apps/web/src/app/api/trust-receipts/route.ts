import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@/lib/db';
import crypto from 'crypto';

function generateHash(data: object): string {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, verified: 0, invalid: 0, chainLength: 0 },
      source: 'mock'
    });
  }
  
  try {
    const result = await pool.query(`
      SELECT self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id
      FROM trust_receipts 
      WHERE (tenant_id = $1 OR tenant_id IS NULL)
      ORDER BY timestamp DESC 
      LIMIT $2
    `, [tenant, limit]);
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE signature IS NOT NULL AND signature != '') as verified,
        COUNT(*) FILTER (WHERE signature IS NULL OR signature = '') as invalid
      FROM trust_receipts 
      WHERE tenant_id = $1 OR tenant_id IS NULL
    `, [tenant]);
    
    const stats = statsResult.rows[0] || { total: 0, verified: 0, invalid: 0 };
    
    return NextResponse.json({
      success: true,
      data: result.rows.map((row, index) => {
        let timestamp: string;
        try {
          const ts = typeof row.timestamp === 'bigint' ? Number(row.timestamp) : row.timestamp;
          timestamp = ts ? new Date(ts).toISOString() : new Date().toISOString();
        } catch {
          timestamp = new Date().toISOString();
        }
        return {
        id: row.self_hash?.substring(0, 20) || `receipt-${index}`,
        hash: row.self_hash || '',
        previousHash: row.previous_hash || '',
        agentId: row.session_id || '',
        agentName: `Session ${row.session_id?.substring(0, 8) || 'Unknown'}`,
        timestamp,
        trustScore: row.ciq?.trust_score || 85,
        symbiDimensions: row.ciq?.symbi_dimensions || {
          realityIndex: 8.0,
          trustProtocol: 'PASS',
          ethicalAlignment: 4.0,
          resonanceQuality: 'STRONG',
          canvasParity: 85
        },
        verified: !!(row.signature && row.signature.length > 0),
        chainPosition: result.rows.length - index
      }}),
      stats: {
        total: parseInt(stats.total) || 0,
        verified: parseInt(stats.verified) || 0,
        invalid: parseInt(stats.invalid) || 0,
        chainLength: parseInt(stats.total) || 0
      },
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching trust receipts:', error);
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, verified: 0, invalid: 0, chainLength: 0 },
      source: 'error'
    });
  }
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return NextResponse.json({
      success: false,
      error: 'Database not available'
    }, { status: 503 });
  }
  
  try {
    const body = await request.json();
    const { session_id, trust_score, symbi_dimensions, tenant_id, mode } = body;
    
    if (!session_id) {
      return NextResponse.json({
        success: false,
        error: 'session_id is required'
      }, { status: 400 });
    }
    
    const lastReceiptResult = await pool.query(
      `SELECT self_hash FROM trust_receipts ORDER BY timestamp DESC LIMIT 1`
    );
    
    const previousHash = lastReceiptResult.rows[0]?.self_hash || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = Date.now();
    const sessionNonce = crypto.randomBytes(16).toString('hex');
    
    const ciq = {
      trust_score: trust_score || 80,
      symbi_dimensions: symbi_dimensions || {}
    };
    
    const receiptData = {
      session_id,
      timestamp,
      mode: mode || 'production',
      ciq,
      previous_hash: previousHash,
      session_nonce: sessionNonce
    };
    
    const selfHash = generateHash(receiptData);
    const signature = generateHash({ ...receiptData, self_hash: selfHash });
    
    await pool.query(
      `INSERT INTO trust_receipts (self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [selfHash, session_id, '1.0', timestamp, mode || 'production', JSON.stringify(ciq), previousHash, signature, sessionNonce, tenant_id || 'default']
    );
    
    return NextResponse.json({
      success: true,
      data: {
        self_hash: selfHash,
        session_id,
        timestamp,
        ciq
      }
    });
  } catch (error) {
    console.error('Error creating trust receipt:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create trust receipt'
    }, { status: 500 });
  }
}
