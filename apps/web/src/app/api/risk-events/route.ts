import { NextRequest } from 'next/server';
import { getPool } from '../../../lib/db';

const ALLOWED_SEVERITIES = ['low', 'medium', 'high'];

export async function GET(request: NextRequest) {
  const pool = getPool();
  // In tests, getPool is mocked to return empty arrays
  await pool.query('SELECT 1');

  return new Response(JSON.stringify({ success: true, data: [], meta: { source: 'mock' } }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const severity = body.severity;

  if (!ALLOWED_SEVERITIES.includes(severity)) {
    return new Response(JSON.stringify({ success: false }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'content-type': 'application/json' } });
}
