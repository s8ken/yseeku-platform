import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        agents: [
          {
            id: 'claude-agent-1',
            name: 'Claude Analysis',
            status: 'active',
            trustScore: 8.2,
            totalInteractions: 342,
            lastActive: new Date().toISOString(),
            model: 'claude-3-opus',
          },
          {
            id: 'gpt4-agent-2',
            name: 'GPT-4 Reasoning',
            status: 'active',
            trustScore: 7.8,
            totalInteractions: 289,
            lastActive: new Date(Date.now() - 30000).toISOString(),
            model: 'gpt-4-turbo',
          },
          {
            id: 'gemini-agent-3',
            name: 'Gemini Advanced',
            status: 'idle',
            trustScore: 7.5,
            totalInteractions: 156,
            lastActive: new Date(Date.now() - 300000).toISOString(),
            model: 'gemini-2.0',
          },
          {
            id: 'orchestrator-1',
            name: 'Policy Orchestrator',
            status: 'active',
            trustScore: 9.1,
            totalInteractions: 1204,
            lastActive: new Date().toISOString(),
            model: 'sonate-orchestrator',
          },
          {
            id: 'validator-1',
            name: 'Receipt Validator',
            status: 'active',
            trustScore: 9.3,
            totalInteractions: 4823,
            lastActive: new Date().toISOString(),
            model: 'sonate-validator',
          },
        ],
        summary: {
          total: 5,
          active: 4,
          idle: 1,
          avgTrustScore: 8.38,
        },
      }
    });
  } catch (error) {
    console.error('Demo agents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo agents' },
      { status: 500 }
    );
  }
}
