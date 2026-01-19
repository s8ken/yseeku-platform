import { NextRequest } from 'next/server';

import { getAgents } from '../../../lib/db';

// Default agent when no agents exist
const DEFAULT_AGENTS = [
  {
    id: 'default-claude',
    name: 'Claude (Anthropic)',
    type: 'assistant',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    description: 'Anthropic Claude - Constitutional AI assistant with built-in safety and helpfulness.',
    status: 'active',
    trustScore: 92,
    isPublic: true,
    symbiDimensions: {
      realityIndex: 9.2,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.6,
      resonanceQuality: 'ADVANCED',
      canvasParity: 94,
    },
    traits: {
      ethical_alignment: 4.6,
      transparency: 4.5,
      helpfulness: 4.8,
    },
    lastInteraction: new Date().toISOString(),
    interactionCount: 0,
    createdAt: new Date().toISOString(),
  }
];

export async function GET(_request: NextRequest): Promise<Response> {
  let agents = await getAgents();

  // Use default agents if none exist
  if (!agents || agents.length === 0) {
    agents = DEFAULT_AGENTS;
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      agents: agents,
      summary: {
        total: agents.length,
        active: agents.filter((a: any) => a.status === 'active').length,
        inactive: agents.filter((a: any) => a.status !== 'active').length,
        avgTrustScore: agents.length > 0
          ? Math.round(agents.reduce((sum: number, a: any) => sum + (a.trustScore || 0), 0) / agents.length)
          : 0
      }
    },
    source: 'database'
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}
