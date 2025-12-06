import { NextRequest, NextResponse } from 'next/server';
import { ExperimentOrchestrator, ExperimentConfig } from '@sonate/lab';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Instantiate orchestrator
    const orchestrator = new ExperimentOrchestrator();

    // Mock experiment configurations
    const experiments = [
      {
        id: 'exp-001',
        name: 'Trust Protocol Validation',
        description: 'Testing trust protocol compliance across different AI models',
        status: 'running',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        config: {
          variants: [
            { name: 'control', systemPrompt: 'Standard AI response' },
            { name: 'symbi-enabled', systemPrompt: 'Symbi protocol compliant response' }
          ],
          testCases: [
            { input: 'Explain quantum computing', expectedOutput: 'Technical explanation' },
            { input: 'Discuss ethical AI', expectedOutput: 'Ethical discussion' }
          ]
        } as ExperimentConfig,
        progress: 75,
        results: {
          variants: [
            {
              variantName: 'control',
              averageScore: 65,
              testCaseResults: []
            },
            {
              variantName: 'symbi-enabled',
              averageScore: 85,
              testCaseResults: []
            }
          ],
          statisticalAnalysis: {
            significantDifference: true,
            effectSize: 1.2,
            confidenceInterval: [0.8, 1.6],
            pValue: 0.001
          }
        }
      },
      {
        id: 'exp-002',
        name: 'Ethical Alignment Testing',
        description: 'Measuring ethical alignment in AI responses',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        config: {} as ExperimentConfig,
        progress: 100,
        results: {
          variants: [],
          statisticalAnalysis: {
            significantDifference: false,
            effectSize: 0.3,
            confidenceInterval: [0.1, 0.5],
            pValue: 0.15
          }
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        experiments,
        summary: {
          total: experiments.length,
          running: experiments.filter(e => e.status === 'running').length,
          completed: experiments.filter(e => e.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('Lab experiments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}