import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@sonate/orchestrate';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Instantiate orchestrator
    const orchestrator = new AgentOrchestrator();

    // Mock agent data - in production, this would come from the orchestrator's internal storage
    const agents = [
      {
        id: 'agent-001',
        name: 'TrustScorer',
        type: 'analysis',
        status: 'active',
        config: {
          capabilities: ['trust_scoring', 'risk_assessment'],
          permissions: ['read_trust_data', 'write_reports']
        },
        trustScores: {
          overall: 92,
          consent: 95,
          inspection: 88,
          validation: 90
        },
        lastActive: new Date().toISOString(),
        tasksCompleted: 1250,
        currentTask: null
      },
      {
        id: 'agent-002',
        name: 'AuditMonitor',
        type: 'monitoring',
        status: 'active',
        config: {
          capabilities: ['audit_logging', 'compliance_checking'],
          permissions: ['read_audit_logs', 'write_alerts']
        },
        trustScores: {
          overall: 98,
          consent: 100,
          inspection: 95,
          validation: 100
        },
        lastActive: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        tasksCompleted: 890,
        currentTask: 'monitoring-system-logs'
      },
      {
        id: 'agent-003',
        name: 'ExperimentRunner',
        type: 'execution',
        status: 'idle',
        config: {
          capabilities: ['experiment_execution', 'data_collection'],
          permissions: ['run_experiments', 'access_lab_data']
        },
        trustScores: {
          overall: 87,
          consent: 85,
          inspection: 90,
          validation: 80
        },
        lastActive: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        tasksCompleted: 456,
        currentTask: null
      }
    ];

    // Summary statistics
    const summary = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      averageTrustScore: Math.round(agents.reduce((sum, a) => sum + a.trustScores.overall, 0) / agents.length),
      totalTasksCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        agents,
        summary
      }
    });

  } catch (error) {
    console.error('Orchestrate agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}