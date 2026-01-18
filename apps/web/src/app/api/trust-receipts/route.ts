import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
}
