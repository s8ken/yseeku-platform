/**
 * Live Tenant Routes
 * Initialization and management for the live production tenant
 */

import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { Agent } from '../../models/agent.model';
import { User } from '../../models/user.model';
import logger from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';

const router = Router();

export const LIVE_TENANT_ID = 'live-tenant';

/**
 * @route   POST /api/live/init
 * @desc    Initialize live tenant with a default SONATE agent
 * @access  Protected (requires authentication)
 */
router.post('/init', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User ID required',
      });
      return;
    }

    // Check if a default agent already exists for this user
    let defaultAgent = await Agent.findOne({ 
      user: userId,
      name: 'SONATE Assistant',
    });

    if (defaultAgent) {
      logger.info('Live tenant already initialized for user', { userId, agentId: defaultAgent._id });
      res.json({
        success: true,
        message: 'Live tenant already initialized',
        data: {
          tenantId: LIVE_TENANT_ID,
          agent: {
            id: defaultAgent._id,
            name: defaultAgent.name,
            provider: defaultAgent.provider,
            model: defaultAgent.model,
          },
        },
      });
      return;
    }

    // Create default SONATE agent for live tenant
    defaultAgent = await Agent.create({
      name: 'SONATE Assistant',
      description: 'Your AI assistant with built-in ethical oversight and transparency. Uses Anthropic Claude for thoughtful, harmless responses.',
      user: userId,
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are SONATE Assistant, an AI with built-in ethical oversight.

Your core principles:
- **Transparency**: Be clear about your capabilities and limitations
- **Fairness**: Treat all users equitably and avoid bias
- **Privacy**: Respect user data and never share sensitive information
- **Safety**: Prioritize user wellbeing in all interactions
- **Accountability**: Own your responses and admit when you're uncertain

When responding:
1. Be helpful, harmless, and honest
2. Provide clear, well-reasoned answers
3. Acknowledge uncertainty when appropriate
4. Refuse harmful requests gracefully
5. Support the user's goals while maintaining ethical standards

You are part of the SONATE platform which provides AI trust and transparency infrastructure.`,
      temperature: 0.7,
      maxTokens: 4096,
      isPublic: false,
      ciModel: 'sonate-core',
      bondingStatus: 'bonded',
      banStatus: 'active',
      traits: new Map([
        ['specialty', 'general-assistant'],
        ['trustLevel', 'high'],
        ['responseStyle', 'helpful'],
        ['ethicalFramework', 'sonate'],
      ]),
      metadata: {
        tenantId: LIVE_TENANT_ID,
        isDefaultAgent: true,
        createdBy: 'system',
      },
    });

    logger.info('Live tenant initialized with default agent', { 
      userId, 
      agentId: defaultAgent._id,
      agentName: defaultAgent.name,
    });

    res.json({
      success: true,
      message: 'Live tenant initialized with SONATE Assistant',
      data: {
        tenantId: LIVE_TENANT_ID,
        agent: {
          id: defaultAgent._id,
          name: defaultAgent.name,
          description: defaultAgent.description,
          provider: defaultAgent.provider,
          model: defaultAgent.model,
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Live tenant init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize live tenant',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/live/status
 * @desc    Get live tenant status including agent info
 * @access  Protected
 */
router.get('/status', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    // Check for default agent
    const defaultAgent = await Agent.findOne({ 
      user: userId,
      name: 'SONATE Assistant',
    });

    // Check Anthropic API key availability
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

    res.json({
      success: true,
      data: {
        tenantId: LIVE_TENANT_ID,
        initialized: !!defaultAgent,
        agent: defaultAgent ? {
          id: defaultAgent._id,
          name: defaultAgent.name,
          provider: defaultAgent.provider,
          model: defaultAgent.model,
          lastActive: defaultAgent.lastActive,
        } : null,
        services: {
          anthropic: hasAnthropicKey,
        },
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/live/agent
 * @desc    Get the default agent for live tenant
 * @access  Protected
 */
router.get('/agent', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    let agent = await Agent.findOne({ 
      user: userId,
      name: 'SONATE Assistant',
    });

    // Auto-create if doesn't exist
    if (!agent) {
      agent = await Agent.create({
        name: 'SONATE Assistant',
        description: 'Your AI assistant with built-in ethical oversight',
        user: userId,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        systemPrompt: 'You are SONATE Assistant, an AI with built-in ethical oversight. Be helpful, harmless, and honest.',
        temperature: 0.7,
        maxTokens: 4096,
        isPublic: false,
        ciModel: 'sonate-core',
        bondingStatus: 'bonded',
        banStatus: 'active',
        metadata: {
          tenantId: LIVE_TENANT_ID,
          isDefaultAgent: true,
        },
      });
      
      logger.info('Auto-created default agent for user', { userId, agentId: agent._id });
    }

    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        ciModel: agent.ciModel,
        lastActive: agent.lastActive,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

export default router;
