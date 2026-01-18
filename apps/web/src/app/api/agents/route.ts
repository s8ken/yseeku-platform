import { NextRequest } from 'next/server';
import { getAgents } from '../../../lib/db';

export async function GET(request: NextRequest) {
  const agents = await getAgents();
  return new Response(JSON.stringify({ success: true, data: agents }), { status: 200, headers: { 'content-type': 'application/json' } });
}
