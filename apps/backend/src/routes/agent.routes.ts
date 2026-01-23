/**
 * Agent Management Routes
 * Ported and enhanced from YCQ-Sonate/backend/routes/agent.routes.js
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { CreateAgentSchema, UpdateAgentSchema, MongoIdSchema } from '../schemas/validation.schemas';
import { Agent, IAgent } from '../models/agent.model';
import { Conversation } from '../models/conversation.model';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/agents
 * @desc    Get all agents for current user with trust metrics from conversations
 * @access  Private
 * @query   status - Filter by status (optional)
 * @query   tenant - Filter by tenant (optional)
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tenant } = req.query;

    const query: any = { user: req.userId };

    if (tenant) {
      query.tenant = tenant;
    }

    const agents = await Agent.find(query)
      .select('-apiKeyId')
      .sort({ lastActive: -1 });

    // Fetch conversations to calculate trust metrics per agent
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const conversations = await Conversation.find({ user: req.userId })
      .select('messages agents lastActivity')
      .lean();

    // Build metrics map for each agent
    const agentMetrics: Map<string, {
      totalTrust: number;
      messageCount: number;
      interactions24h: number;
      principles: { [key: string]: number };
      principleCount: number;
      lastInteraction: Date | null;
      statuses: { pass: number; partial: number; fail: number };
    }> = new Map();

    for (const agent of agents) {
      agentMetrics.set(agent._id.toString(), {
        totalTrust: 0, messageCount: 0, interactions24h: 0,
        principles: {}, principleCount: 0, lastInteraction: null,
        statuses: { pass: 0, partial: 0, fail: 0 },
      });
    }

    // Process conversations to extract trust metrics
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        if (msg.sender !== 'ai' || !msg.agentId) continue;
        const metrics = agentMetrics.get(msg.agentId.toString());
        if (!metrics) continue;

        metrics.messageCount++;
        if (msg.timestamp >= oneDayAgo) metrics.interactions24h++;
        if (!metrics.lastInteraction || msg.timestamp > metrics.lastInteraction) {
          metrics.lastInteraction = msg.timestamp;
        }

        const trustScore = (msg.trustScore || 5) * 2;
        metrics.totalTrust += trustScore;

        const trustEval = msg.metadata?.trustEvaluation;
        if (trustEval) {
          if (trustEval.status === 'PASS') metrics.statuses.pass++;
          else if (trustEval.status === 'PARTIAL') metrics.statuses.partial++;
          else if (trustEval.status === 'FAIL') metrics.statuses.fail++;

          const principles = trustEval.trustScore?.principles;
          if (principles) {
            metrics.principleCount++;
            for (const [key, value] of Object.entries(principles)) {
              if (typeof value === 'number') {
                metrics.principles[key] = (metrics.principles[key] || 0) + value;
              }
            }
          }
        }
      }
    }

    // Enhance agents with calculated trust metrics
    const enhancedAgents = agents.map(agent => {
      const agentObj = agent.toObject();
      const metrics = agentMetrics.get(agent._id.toString());

      if (!metrics || metrics.messageCount === 0) {
        return {
          ...agentObj, id: agent._id.toString(), trustScore: 85,
          interactionCount: 0, lastInteraction: agent.lastActive?.toISOString(),
          sonateDimensions: {
            realityIndex: 8.5, trustProtocol: 'PASS', ethicalAlignment: 4.2,
            resonanceQuality: 'STRONG', canvasParity: 85,
          },
        };
      }

      const avgTrust = Math.round(metrics.totalTrust / metrics.messageCount);
      const principleAvg: { [key: string]: number } = {};
      if (metrics.principleCount > 0) {
        for (const [key, value] of Object.entries(metrics.principles)) {
          principleAvg[key] = value / metrics.principleCount;
        }
      }

      const totalStatuses = metrics.statuses.pass + metrics.statuses.partial + metrics.statuses.fail;
      let trustProtocol = 'PASS';
      if (totalStatuses > 0) {
        const passRate = metrics.statuses.pass / totalStatuses;
        if (passRate < 0.5) trustProtocol = 'FAIL';
        else if (passRate < 0.8) trustProtocol = 'PARTIAL';
      }

      const realityIndex = principleAvg.INSPECTION_MANDATE || principleAvg.CONTINUOUS_VALIDATION || avgTrust / 10;
      const ethicalAlignment = principleAvg.ETHICAL_OVERRIDE || avgTrust / 20;
      const canvasParity = Math.round(
        ((principleAvg.RIGHT_TO_DISCONNECT || 8) + (principleAvg.MORAL_RECOGNITION || 8)) / 2 * 10
      );

      let resonanceQuality = 'BASIC';
      if (avgTrust >= 90) resonanceQuality = 'BREAKTHROUGH';
      else if (avgTrust >= 80) resonanceQuality = 'ADVANCED';
      else if (avgTrust >= 70) resonanceQuality = 'STRONG';

      return {
        ...agentObj, id: agent._id.toString(), trustScore: avgTrust,
        interactionCount: metrics.interactions24h,
        lastInteraction: metrics.lastInteraction?.toISOString() || agent.lastActive?.toISOString(),
        sonateDimensions: {
          realityIndex: Math.round(realityIndex * 10) / 10, trustProtocol,
          ethicalAlignment: Math.round(ethicalAlignment * 10) / 10, resonanceQuality,
          canvasParity: Math.min(100, Math.max(0, canvasParity)),
        },
      };
    });

    const summary = {
      total: agents.length,
      active: enhancedAgents.filter(a => {
        const hrs = a.lastInteraction ? (Date.now() - new Date(a.lastInteraction).getTime()) / 3600000 : 999;
        return hrs < 24;
      }).length,
      inactive: enhancedAgents.filter(a => {
        const hrs = a.lastInteraction ? (Date.now() - new Date(a.lastInteraction).getTime()) / 3600000 : 999;
        return hrs >= 24;
      }).length,
      avgTrustScore: enhancedAgents.length > 0
        ? Math.round(enhancedAgents.reduce((sum, a) => sum + a.trustScore, 0) / enhancedAgents.length)
        : 85,
    };

    res.json({
      success: true,
      data: { agents: enhancedAgents, summary },
      source: 'database',
    });
  } catch (error: unknown) {
    logger.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/agents/public
 * @desc    Get all public agents
 * @access  Private
 */
router.get('/public', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const publicAgents = await Agent.find({ isPublic: true })
      .select('-apiKeyId')
      .populate('user', 'name')
      .sort({ lastActive: -1 });

    res.json({
      success: true,
      data: { agents: publicAgents },
    });
  } catch (error: unknown) {
    logger.error('Get public agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public agents',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/agents/:id
 * @desc    Get single agent by ID
 * @access  Private
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.userId,
    }).select('-apiKeyId');

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { agent },
    });
  } catch (error: unknown) {
    logger.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/agents
 * @desc    Create new agent
 * @access  Private
 */
router.post('/', protect, validateBody(CreateAgentSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      provider,
      model,
      apiKeyId,
      systemPrompt,
      temperature,
      maxTokens,
      isPublic,
      traits,
      ciModel,
    } = req.body;

    // Check for duplicate agent name for this user
    const existingAgent = await Agent.findOne({
      name,
      user: req.userId,
    });

    if (existingAgent) {
      res.status(400).json({
        success: false,
        message: 'An agent with this name already exists',
      });
      return;
    }

    // Create agent
    const agent = await Agent.create({
      name,
      description,
      user: req.userId,
      provider,
      model,
      apiKeyId: apiKeyId || req.userId, // Use user ID as fallback
      systemPrompt,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 1000,
      isPublic: isPublic ?? false,
      traits: traits || new Map([
        ['ethical_alignment', 5],
        ['creativity', 3],
        ['precision', 3],
        ['adaptability', 3]
      ]),
      ciModel: ciModel || 'none',
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: { agent },
    });
  } catch (error: unknown) {
    logger.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agent',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   PUT /api/agents/:id
 * @desc    Update agent
 * @access  Private
 */
router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'systemPrompt', 'temperature',
      'maxTokens', 'isPublic', 'traits', 'ciModel', 'metadata'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (agent as any)[field] = req.body[field];
      }
    });

    agent.lastActive = new Date();
    const updatedAgent = await agent.save();

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: { agent: updatedAgent },
    });
  } catch (error: unknown) {
    logger.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   DELETE /api/agents/:id
 * @desc    Delete agent
 * @access  Private
 */
router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully',
      data: { agentId: agent._id },
    });
  } catch (error: unknown) {
    logger.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/agents/connect
 * @desc    Connect two agents for agent-to-agent communication
 * @access  Private
 */
router.post('/connect', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceAgentId, targetAgentId } = req.body;

    if (!sourceAgentId || !targetAgentId) {
      res.status(400).json({
        success: false,
        message: 'Please provide both sourceAgentId and targetAgentId',
      });
      return;
    }

    // Verify both agents exist and belong to user
    const [sourceAgent, targetAgent] = await Promise.all([
      Agent.findOne({ _id: sourceAgentId, user: req.userId }),
      Agent.findOne({ _id: targetAgentId, user: req.userId }),
    ]);

    if (!sourceAgent || !targetAgent) {
      res.status(404).json({
        success: false,
        message: 'One or both agents not found',
      });
      return;
    }

    // Add connection if it doesn't exist
    if (!sourceAgent.connectedAgents.includes(targetAgent._id)) {
      sourceAgent.connectedAgents.push(targetAgent._id);
      await sourceAgent.save();
    }

    res.json({
      success: true,
      message: 'Agents connected successfully',
      data: {
        sourceAgent: sourceAgent._id,
        targetAgent: targetAgent._id,
      },
    });
  } catch (error: unknown) {
    logger.error('Connect agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect agents',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/agents/:id/external-systems
 * @desc    Add external system integration to agent
 * @access  Private
 */
router.post('/:id/external-systems', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    const { name, type, endpoint, apiKey, config } = req.body;

    if (!name || !type || !endpoint) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, type, and endpoint for external system',
      });
      return;
    }

    await agent.addExternalSystem({
      name,
      type,
      endpoint,
      apiKey,
      config,
    });

    res.json({
      success: true,
      message: 'External system added successfully',
      data: { agent },
    });
  } catch (error: unknown) {
    logger.error('Add external system error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add external system',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   PUT /api/agents/:id/external-systems/:systemName/toggle
 * @desc    Toggle external system active status
 * @access  Private
 */
router.put('/:id/external-systems/:systemName/toggle', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    const { isActive } = req.body;

    await agent.toggleExternalSystem(req.params.systemName, isActive);

    res.json({
      success: true,
      message: 'External system status updated',
      data: { agent },
    });
  } catch (error: unknown) {
    logger.error('Toggle external system error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle external system',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/agents/:id/external-systems/:systemName/sync
 * @desc    Sync with external system
 * @access  Private
 */
router.post('/:id/external-systems/:systemName/sync', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
      return;
    }

    await agent.updateExternalSystemSync(req.params.systemName);

    res.json({
      success: true,
      message: 'External system synced successfully',
      data: { agent },
    });
  } catch (error: unknown) {
    logger.error('Sync external system error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync external system',
      error: getErrorMessage(error),
    });
  }
});

export default router;
