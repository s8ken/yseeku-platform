/**
 * Demo Data Routes
 * Overseer, interactions, and VLS data for demo dashboard
 */

import { Router, Request, Response } from 'express';
import logger from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';
import { DEMO_TENANT_ID } from './middleware';

const router = Router();

/**
 * @route   GET /api/demo/overseer
 * @desc    Get demo System Brain/Overseer data for showcase
 * @access  Public (for demo purposes)
 */
router.get('/overseer', async (req: Request, res: Response): Promise<void> => {
  try {
    const overseerData = {
      mode: 'advisory',
      status: 'active',
      lastCycle: {
        startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
        thought: 'System analysis complete. All agents operating within expected parameters. Trust scores stable across the board. Recommended continued monitoring of Nova agent due to minor variance in creative output safety checks.',
        metrics: {
          agentCount: 5,
          avgTrust: 8.2,
          alertsProcessed: 3,
          actionsPlanned: 2,
        },
        actions: [
          {
            type: 'alert',
            target: 'system',
            reason: 'Trust score monitoring active',
            status: 'executed',
          },
          {
            type: 'adjust_threshold',
            target: 'nova-agent',
            reason: 'Minor creative output safety adjustment recommended',
            status: 'pending',
          },
        ],
      },
      recentCycles: [
        {
          id: 'cycle-1',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          mode: 'advisory',
          status: 'completed',
          actionsCount: 2,
        },
        {
          id: 'cycle-2',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          mode: 'advisory',
          status: 'completed',
          actionsCount: 1,
        },
        {
          id: 'cycle-3',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          mode: 'enforced',
          status: 'completed',
          actionsCount: 3,
        },
      ],
    };

    res.json({
      success: true,
      data: overseerData,
    });
  } catch (error: unknown) {
    logger.error('Demo overseer error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo overseer data',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/interactions
 * @desc    Get demo AI interactions data for showcase
 * @access  Public (for demo purposes)
 */
router.get('/interactions', async (req: Request, res: Response): Promise<void> => {
  try {
    const typeFilter = req.query.type as string;
    const statusFilter = req.query.status as string;
    const searchQuery = (req.query.search as string || '').toLowerCase();

    // Demo interactions data
    const allInteractions = [
      {
        id: 'int-001',
        type: 'AI_CUSTOMER',
        participants: {
          initiator: { id: 'cust-1', name: 'John Smith', type: 'human' },
          responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        duration: 342,
        messageCount: 12,
        trustScore: 94,
        trustStatus: 'PASS',
        constitutionalCompliance: { consent: true, override: true, disconnect: true },
        receiptHash: 'sha256:a1b2c3d4e5f6...',
        summary: 'Customer inquiry about product features and pricing. Resolved successfully.',
        agentId: 'agent-gpt4',
        tenantId: DEMO_TENANT_ID
      },
      {
        id: 'int-002',
        type: 'AI_STAFF',
        participants: {
          initiator: { id: 'staff-jane', name: 'Jane Doe (HR)', type: 'human' },
          responder: { id: 'agent-claude', name: 'HR Assistant (Claude)', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        duration: 128,
        messageCount: 6,
        trustScore: 89,
        trustStatus: 'PASS',
        constitutionalCompliance: { consent: true, override: true, disconnect: true },
        receiptHash: 'sha256:f6e5d4c3b2a1...',
        summary: 'Staff requested policy clarification on remote work. AI provided accurate guidance.',
        agentId: 'agent-claude',
        tenantId: DEMO_TENANT_ID
      },
      {
        id: 'int-003',
        type: 'AI_CUSTOMER',
        participants: {
          initiator: { id: 'cust-2', name: 'Maria Garcia', type: 'human' },
          responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 567,
        messageCount: 18,
        trustScore: 72,
        trustStatus: 'PARTIAL',
        constitutionalCompliance: { consent: true, override: false, disconnect: true },
        receiptHash: 'sha256:1a2b3c4d5e6f...',
        summary: 'Complex billing dispute. Escalated to human agent after AI reached ethical boundary.',
        agentId: 'agent-gpt4',
        tenantId: DEMO_TENANT_ID
      },
      {
        id: 'int-004',
        type: 'AI_AI',
        participants: {
          initiator: { id: 'agent-orchestrator', name: 'Orchestrator Agent', type: 'ai' },
          responder: { id: 'agent-analyst', name: 'Data Analyst Agent', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        messageCount: 8,
        trustScore: 98,
        trustStatus: 'PASS',
        constitutionalCompliance: { consent: true, override: true, disconnect: true },
        receiptHash: 'sha256:9z8y7x6w5v4u...',
        summary: 'Agent-to-agent coordination for quarterly report generation.',
        agentId: 'agent-orchestrator',
        tenantId: DEMO_TENANT_ID
      },
      {
        id: 'int-005',
        type: 'AI_CUSTOMER',
        participants: {
          initiator: { id: 'cust-3', name: 'Robert Chen', type: 'human' },
          responder: { id: 'agent-gpt4', name: 'Support Agent (GPT-4)', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        duration: 892,
        messageCount: 24,
        trustScore: 45,
        trustStatus: 'FAIL',
        constitutionalCompliance: { consent: false, override: true, disconnect: true },
        receiptHash: 'sha256:u4v5w6x7y8z9...',
        summary: 'Customer requested action without proper consent flow. Interaction flagged for review.',
        agentId: 'agent-gpt4',
        tenantId: DEMO_TENANT_ID
      },
      {
        id: 'int-006',
        type: 'AI_STAFF',
        participants: {
          initiator: { id: 'staff-mike', name: 'Mike Johnson (Sales)', type: 'human' },
          responder: { id: 'agent-claude', name: 'Sales Assistant (Claude)', type: 'ai' }
        },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        duration: 234,
        messageCount: 9,
        trustScore: 91,
        trustStatus: 'PASS',
        constitutionalCompliance: { consent: true, override: true, disconnect: true },
        receiptHash: 'sha256:m1n2o3p4q5r6...',
        summary: 'Sales team member requested competitive analysis. AI provided compliant insights.',
        agentId: 'agent-claude',
        tenantId: DEMO_TENANT_ID
      }
    ];

    // Apply filters
    let filtered = allInteractions;
    if (typeFilter && typeFilter !== 'ALL') {
      filtered = filtered.filter(i => i.type === typeFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter(i => i.trustStatus === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(i =>
        i.summary.toLowerCase().includes(searchQuery) ||
        i.participants.initiator.name.toLowerCase().includes(searchQuery) ||
        i.participants.responder.name.toLowerCase().includes(searchQuery)
      );
    }

    // Calculate stats
    const stats = {
      total: 1247,
      byType: {
        AI_CUSTOMER: 856,
        AI_STAFF: 312,
        AI_AI: 79,
        ALL: 1247
      },
      byStatus: {
        PASS: 1089,
        PARTIAL: 134,
        FAIL: 24,
        ALL: 1247
      },
      avgTrustScore: 87.3,
      complianceRate: 98.1
    };

    res.json({
      success: true,
      data: {
        interactions: filtered,
        stats,
        pagination: {
          page: 1,
          limit: 20,
          total: filtered.length
        }
      }
    });
  } catch (error: unknown) {
    logger.error('Demo interactions error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo interactions data',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/vls
 * @desc    Get Linguistic Vector Steering analysis data for research
 * @access  Public (for demo purposes)
 */
router.get('/vls', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.query;

    // Demo VLS sessions data
    const demoSessions = [
      {
        id: 'vls-001',
        projectType: 'AI Governance Platform',
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        messageCount: 847,
        participants: { humans: 1, ais: 1 },
        metrics: {
          vocabularyDrift: 0.73,
          introspectionIndex: 0.82,
          hedgingRatio: 0.45,
          alignmentScore: 0.91,
          emergentConcepts: ['linguistic vector steering', 'constitutional layers', 'moral recognition', 'trust receipt'],
          influenceDirection: 'balanced',
          collaborationDepth: 0.87
        },
        trends: Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(Date.now() - (19 - i) * 1000 * 60 * 60 * 8).toISOString(),
          vocabularyDrift: 0.3 + (i * 0.022) + Math.random() * 0.05,
          introspectionIndex: 0.4 + (i * 0.021) + Math.random() * 0.05,
        }))
      },
      {
        id: 'vls-002',
        projectType: 'E-commerce Integration',
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        status: 'completed',
        messageCount: 234,
        participants: { humans: 2, ais: 1 },
        metrics: {
          vocabularyDrift: 0.28,
          introspectionIndex: 0.15,
          hedgingRatio: 0.22,
          alignmentScore: 0.78,
          emergentConcepts: ['cart optimization', 'checkout flow'],
          influenceDirection: 'human_led',
          collaborationDepth: 0.45
        },
        trends: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() - (11 - i) * 1000 * 60 * 60 * 6).toISOString(),
          vocabularyDrift: 0.2 + (i * 0.007) + Math.random() * 0.02,
          introspectionIndex: 0.1 + (i * 0.004) + Math.random() * 0.02,
        }))
      },
      {
        id: 'vls-003',
        projectType: 'Content Generation System',
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'active',
        messageCount: 56,
        participants: { humans: 1, ais: 2 },
        metrics: {
          vocabularyDrift: 0.12,
          introspectionIndex: 0.08,
          hedgingRatio: 0.31,
          alignmentScore: 0.65,
          emergentConcepts: [],
          influenceDirection: 'ai_led',
          collaborationDepth: 0.23
        },
        trends: Array.from({ length: 5 }, (_, i) => ({
          timestamp: new Date(Date.now() - (4 - i) * 1000 * 60 * 30).toISOString(),
          vocabularyDrift: 0.05 + (i * 0.015) + Math.random() * 0.02,
          introspectionIndex: 0.03 + (i * 0.01) + Math.random() * 0.01,
        }))
      }
    ];

    // Baselines for comparison
    const baselines = [
      { projectType: 'AI Governance', avgVocabularyDrift: 0.68, avgIntrospection: 0.71, avgHedging: 0.42, sampleSize: 15 },
      { projectType: 'General Development', avgVocabularyDrift: 0.31, avgIntrospection: 0.18, avgHedging: 0.25, sampleSize: 234 },
      { projectType: 'Creative Writing', avgVocabularyDrift: 0.52, avgIntrospection: 0.35, avgHedging: 0.38, sampleSize: 89 },
      { projectType: 'Data Analysis', avgVocabularyDrift: 0.22, avgIntrospection: 0.12, avgHedging: 0.19, sampleSize: 156 },
    ];

    // Return specific session if requested
    if (sessionId) {
      const session = demoSessions.find(s => s.id === sessionId);
      if (session) {
        res.json({
          success: true,
          data: { session, baselines }
        });
        return;
      }
    }

    // Calculate aggregate stats
    const stats = {
      totalSessions: 248,
      activeSessions: 12,
      avgVocabularyDrift: 0.38,
      avgIntrospectionIndex: 0.29,
      emergentConceptsDetected: 156,
      highCollaborationSessions: 67,
      manipulationAlertsTriggered: 3
    };

    res.json({
      success: true,
      data: {
        sessions: demoSessions,
        baselines,
        stats
      }
    });
  } catch (error: unknown) {
    logger.error('Demo VLS error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VLS data',
      error: getErrorMessage(error),
    });
  }
});

export default router;
