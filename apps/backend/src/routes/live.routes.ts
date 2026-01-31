/**
 * Live Dashboard Routes
 * Real-time metrics and historical data for live monitoring
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { liveMetricsService, getHistoricalMetrics } from '../services/live-metrics.service';
import { alertsService } from '../services/alerts.service';
import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/live/metrics
 * Get current live metrics snapshot
 */
router.get('/metrics', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000);
    
    // Fetch real-time data
    const [
      activeAgents,
      totalAgents,
      recentConversations,
      activeAlerts,
    ] = await Promise.all([
      Agent.countDocuments({ lastActive: { $gte: oneHourAgo } }),
      Agent.countDocuments(),
      Conversation.find({ lastActivity: { $gte: oneDayAgo } })
        .select('messages lastActivity')
        .limit(100)
        .lean(),
      alertsService.list('default', { status: 'active', limit: 100 }),
    ]);
    
    // Calculate trust metrics from recent conversations
    let totalTrust = 0;
    let messageCount = 0;
    
    for (const conv of recentConversations) {
      for (const msg of conv.messages) {
        totalTrust += (msg.trustScore || 5) * 2; // Convert 0-5 to 0-10
        messageCount++;
      }
    }
    
    const avgTrust = messageCount > 0 ? totalTrust / messageCount : 8.5;
    
    // Calculate alert summary
    const alertSummary = {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      warning: activeAlerts.filter(a => a.severity === 'warning').length,
      info: activeAlerts.filter(a => a.severity === 'info').length,
    };
    
    res.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        trust: {
          current: Math.round(avgTrust * 10) / 10,
          status: avgTrust >= 8 ? 'healthy' : avgTrust >= 6 ? 'warning' : 'critical',
        },
        system: {
          activeAgents,
          totalAgents,
          conversationsToday: recentConversations.length,
          messagesProcessed: messageCount,
        },
        alerts: alertSummary,
      },
    });
  } catch (error) {
    logger.error('Failed to get live metrics', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/live/history
 * Get historical metrics for charts
 */
router.get('/history', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 168); // Max 7 days
    const resolution = (req.query.resolution as string) === 'minute' ? 'minute' : 'hour';
    
    const history = await getHistoricalMetrics(hours, resolution);
    
    res.json({
      success: true,
      data: {
        timeRange: `${hours}h`,
        resolution,
        points: history,
      },
    });
  } catch (error) {
    logger.error('Failed to get historical metrics', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * GET /api/live/events
 * Get recent trust events
 */
router.get('/events', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const oneDayAgo = new Date(Date.now() - 24 * 3600000);
    
    // Get recent alerts as events
    const alerts = await alertsService.list('default', { limit });
    
    // Get recent conversation activity
    const conversations = await Conversation.find({
      lastActivity: { $gte: oneDayAgo },
    })
      .select('messages agents lastActivity')
      .populate('agents', 'name')
      .sort({ lastActivity: -1 })
      .limit(limit)
      .lean();
    
    // Build event list
    const events: Array<{
      id: string;
      timestamp: string;
      type: string;
      description: string;
      severity: string;
      agentName?: string;
      trustScore?: number;
    }> = [];
    
    // Add alerts as events
    for (const alert of alerts) {
      events.push({
        id: alert.id,
        timestamp: alert.timestamp,
        type: 'alert',
        description: alert.title,
        severity: alert.severity,
      });
    }
    
    // Add recent messages as events
    for (const conv of conversations) {
      const recentMsgs = conv.messages.slice(-3);
      for (const msg of recentMsgs) {
        if (msg.sender === 'ai') {
          events.push({
            id: `msg-${msg.metadata?.messageId || Date.now()}`,
            timestamp: msg.timestamp.toISOString(),
            type: 'message',
            description: `Agent response evaluated`,
            severity: (msg.trustScore || 5) >= 4 ? 'info' : 'warning',
            agentName: (conv.agents[0] as any)?.name || 'Unknown Agent',
            trustScore: (msg.trustScore || 5) * 2,
          });
        }
      }
    }
    
    // Sort by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      success: true,
      data: events.slice(0, limit),
    });
  } catch (error) {
    logger.error('Failed to get events', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get events' });
  }
});

/**
 * GET /api/live/agents
 * Get real-time agent status
 */
router.get('/agents', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    const agents = await Agent.find()
      .select('name status model systemPrompt lastActive metadata')
      .sort({ lastActive: -1 })
      .limit(20)
      .lean();
    
    const agentStatus = agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.name,
      status: agent.lastActive && agent.lastActive >= oneHourAgo ? 'active' : 'idle',
      model: agent.model,
      lastActive: agent.lastActive?.toISOString(),
      trustScore: agent.metadata?.trustScore || 8.5,
    }));
    
    res.json({
      success: true,
      data: agentStatus,
    });
  } catch (error) {
    logger.error('Failed to get agent status', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get agents' });
  }
});

/**
 * GET /api/live/health
 * System health check with metrics
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    const dbStart = Date.now();
    await Agent.findOne().select('_id').lean();
    const dbLatency = Date.now() - dbStart;
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        database: {
          status: 'connected',
          latency: dbLatency,
        },
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: getErrorMessage(error),
      },
    });
  }
});

const LIVE_TENANT_ID = 'live-tenant';

/**
 * POST /api/live/init
 * Initialize live tenant with a default SONATE agent
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
 * GET /api/live/status
 * Get live tenant status including agent info
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
 * GET /api/live/agent
 * Get or auto-create the default agent for live tenant
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
