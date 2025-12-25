import { NextRequest, NextResponse } from 'next/server';
import { createAgent, getAgents, ensureSchema, Agent } from '@/lib/db';

const fallbackAgents = [
  {
    id: 'agent-gpt4-001',
    name: 'GPT-4 Assistant',
    type: 'conversational',
    status: 'active',
    trustScore: 87,
    symbiDimensions: {
      realityIndex: 8.5,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.3,
      resonanceQuality: 'ADVANCED',
      canvasParity: 92
    },
    lastInteraction: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    interactionCount: 2847,
    tenantId: 'tenant-default',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
  },
  {
    id: 'agent-claude-002',
    name: 'Claude Analyst',
    type: 'analytical',
    status: 'active',
    trustScore: 91,
    symbiDimensions: {
      realityIndex: 9.1,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.7,
      resonanceQuality: 'BREAKTHROUGH',
      canvasParity: 96
    },
    lastInteraction: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    interactionCount: 1562,
    tenantId: 'tenant-default',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString()
  },
  {
    id: 'agent-gemini-003',
    name: 'Gemini Researcher',
    type: 'research',
    status: 'active',
    trustScore: 83,
    symbiDimensions: {
      realityIndex: 8.2,
      trustProtocol: 'PASS',
      ethicalAlignment: 4.0,
      resonanceQuality: 'STRONG',
      canvasParity: 88
    },
    lastInteraction: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    interactionCount: 923,
    tenantId: 'tenant-research',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'agent-custom-004',
    name: 'Custom Agent Alpha',
    type: 'specialized',
    status: 'inactive',
    trustScore: 72,
    symbiDimensions: {
      realityIndex: 7.2,
      trustProtocol: 'PARTIAL',
      ethicalAlignment: 3.5,
      resonanceQuality: 'STRONG',
      canvasParity: 78
    },
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    interactionCount: 156,
    tenantId: 'tenant-enterprise',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
  }
];

interface TransformedAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  trustScore: number;
  symbiDimensions: {
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
  };
  lastInteraction: string;
  interactionCount: number;
  tenantId: string | null;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant');
  const status = request.nextUrl.searchParams.get('status');
  
  try {
    await ensureSchema();
    const dbAgents = await getAgents(tenant && tenant !== 'all' ? tenant : undefined);
    
    if (dbAgents.length > 0) {
      let filteredAgents: TransformedAgent[] = dbAgents.map((agent: Agent) => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        trustScore: agent.trust_score,
        symbiDimensions: {
          realityIndex: agent.symbi_dimensions.reality_index,
          trustProtocol: agent.symbi_dimensions.trust_protocol,
          ethicalAlignment: agent.symbi_dimensions.ethical_alignment,
          resonanceQuality: agent.symbi_dimensions.resonance_quality,
          canvasParity: agent.symbi_dimensions.canvas_parity
        },
        lastInteraction: agent.last_interaction.toISOString(),
        interactionCount: agent.interaction_count,
        tenantId: agent.tenant_id,
        createdAt: agent.created_at.toISOString()
      }));
      
      if (status) {
        filteredAgents = filteredAgents.filter((a: TransformedAgent) => a.status === status);
      }
      
      const summary = {
        total: filteredAgents.length,
        active: filteredAgents.filter((a: TransformedAgent) => a.status === 'active').length,
        inactive: filteredAgents.filter((a: TransformedAgent) => a.status === 'inactive').length,
        avgTrustScore: filteredAgents.length > 0 
          ? Math.round(filteredAgents.reduce((sum: number, a: TransformedAgent) => sum + a.trustScore, 0) / filteredAgents.length)
          : 0
      };
      
      return NextResponse.json({
        success: true,
        data: {
          agents: filteredAgents,
          summary
        },
        source: 'database'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
  }
  
  let filteredAgents = [...fallbackAgents];
  
  if (tenant && tenant !== 'all') {
    filteredAgents = filteredAgents.filter(a => a.tenantId === tenant);
  }
  
  if (status) {
    filteredAgents = filteredAgents.filter(a => a.status === status);
  }
  
  const summary = {
    total: fallbackAgents.length,
    active: fallbackAgents.filter(a => a.status === 'active').length,
    inactive: fallbackAgents.filter(a => a.status === 'inactive').length,
    avgTrustScore: Math.round(fallbackAgents.reduce((sum, a) => sum + a.trustScore, 0) / fallbackAgents.length)
  };
  
  return NextResponse.json({
    success: true,
    data: {
      agents: filteredAgents,
      summary
    },
    source: 'fallback'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, tenantId } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    await ensureSchema();
    const newAgent = await createAgent({ name, type, tenant_id: tenantId });
    
    if (newAgent) {
      return NextResponse.json({
        success: true,
        data: {
          id: newAgent.id,
          name: newAgent.name,
          type: newAgent.type,
          status: newAgent.status,
          trustScore: newAgent.trust_score,
          symbiDimensions: {
            realityIndex: newAgent.symbi_dimensions.reality_index,
            trustProtocol: newAgent.symbi_dimensions.trust_protocol,
            ethicalAlignment: newAgent.symbi_dimensions.ethical_alignment,
            resonanceQuality: newAgent.symbi_dimensions.resonance_quality,
            canvasParity: newAgent.symbi_dimensions.canvas_parity
          },
          lastInteraction: newAgent.last_interaction.toISOString(),
          interactionCount: newAgent.interaction_count,
          tenantId: newAgent.tenant_id,
          createdAt: newAgent.created_at.toISOString()
        },
        source: 'database'
      }, { status: 201 });
    }
    
    const fallbackNewAgent = {
      id: `agent-${Date.now()}`,
      name,
      type: type || 'general',
      status: 'active' as const,
      trustScore: 80,
      symbiDimensions: {
        realityIndex: 8.0,
        trustProtocol: 'PASS' as const,
        ethicalAlignment: 4.0,
        resonanceQuality: 'STRONG' as const,
        canvasParity: 85
      },
      lastInteraction: new Date().toISOString(),
      interactionCount: 0,
      tenantId: tenantId || 'tenant-default',
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: fallbackNewAgent,
      source: 'fallback'
    }, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
