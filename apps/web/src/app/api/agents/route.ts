import { NextRequest } from 'next/server';
import { getAgents } from '../../../lib/db';

export async function GET(request: NextRequest) {
  const agents = await getAgents();
  return new Response(JSON.stringify({
    success: true,
    data: {
      agents: agents || [],
      summary: {
        total: agents?.length || 0,
        active: agents?.filter((a: any) => a.status === 'active')?.length || 0,
        avgTrustScore: 0
      }
    },
    source: 'database'
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}
