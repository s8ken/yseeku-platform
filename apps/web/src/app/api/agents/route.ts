import { NextResponse } from 'next/server';

// Demo mode agents endpoint
export async function GET() {
  try {
    const demoAgents = [
      {
        id: 'agent-1',
        name: 'Customer Support',
        type: 'support',
        status: 'active',
        trustScore: 0.92,
        lastInteraction: new Date().toISOString(),
        capabilities: ['text_generation', 'reasoning', 'empathy'],
        model: 'claude-3-haiku-20240307',
        tenantId: 'demo'
      },
      {
        id: 'agent-2', 
        name: 'Sales Assistant',
        type: 'sales',
        status: 'active',
        trustScore: 0.88,
        lastInteraction: new Date(Date.now() - 300000).toISOString(),
        capabilities: ['text_generation', 'product_knowledge', 'persuasion'],
        model: 'claude-3-sonnet-20240229',
        tenantId: 'demo'
      },
      {
        id: 'agent-3',
        name: 'Technical Support',
        type: 'technical',
        status: 'active',
        trustScore: 0.95,
        lastInteraction: new Date(Date.now() - 600000).toISOString(),
        capabilities: ['code_generation', 'troubleshooting', 'documentation'],
        model: 'claude-3-opus-20240229',
        tenantId: 'demo'
      }
    ];

    return NextResponse.json({
      success: true,
      data: demoAgents
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
