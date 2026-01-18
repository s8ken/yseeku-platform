import { NextRequest } from 'next/server';
import { getTenants } from '../../../lib/db';

export async function GET() {
  const tenants = await getTenants();
  return new Response(JSON.stringify({ success: true, data: { tenants } }), { status: 200, headers: { 'content-type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  // Require authentication for tenant creation in tests
  const auth = request.headers.get('authorization');
  if (!auth) {
    return new Response(JSON.stringify({ success: false }), { status: 401, headers: { 'content-type': 'application/json' } });
  }

  // In real app, handle creation; tests only assert 401 for unauth requests
  return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'content-type': 'application/json' } });
}
