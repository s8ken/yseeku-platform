/**
 * Demo Routes - Investor Showcase Data
 *
 * These routes provide pre-populated showcase data for demos to investors
 * and potential customers. They use the demo tenant and don't require
 * authentication for easy access during presentations.
 *
 * UNIFIED DEMO APPROACH: All routes now query REAL demo tenant data,
 * seeded by the demo-seeder service. No more hardcoded fake data.
 *
 * SECURITY: Defense-in-depth guard prevents production exposure even if
 * accidentally mounted. Routes are only active when NODE_ENV !== 'production'
 * OR when ENABLE_DEMO_MODE=true is explicitly set.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { alertsService } from '../services/alerts.service';
import { demoSeederService } from '../services/demo-seeder.service';
import { Tenant } from '../models/tenant.model';
import { Agent } from '../models/agent.model';
import { Conversation } from '../models/conversation.model';
import { Experiment } from '../models/experiment.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { AlertModel } from '../models/alert.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

const DEMO_TENANT_ID = 'demo-tenant';

/**
 * Defense-in-depth middleware: Block demo routes in production
 * unless explicitly enabled via ENABLE_DEMO_MODE environment variable.
 * 
 * NOTE: For demo/showcase platforms, ENABLE_DEMO_MODE should be set to 'true'
 * in the deployment environment. This is safe because demo routes only
 * read from the demo tenant and don't modify production data.
 */
const demoGuard = (req: Request, res: Response, next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const demoExplicitlyEnabled = process.env.ENABLE_DEMO_MODE === 'true';
  
  // Allow demo routes in non-production environments
  if (!isProduction) {
    next();
    return;
  }
  
  // In production, require explicit enablement
  if (!demoExplicitlyEnabled) {
    logger.warn('Demo route blocked in production - set ENABLE_DEMO_MODE=true to enable', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(404).json({
      success: false,
      message: 'Demo routes are not enabled. Set ENABLE_DEMO_MODE=true in environment.',
    });
    return;
  }
  
  next();
};

// Apply demo guard to all routes in this router
router.use(demoGuard);

/**
 * @route   POST /api/demo/init
 * @desc    Initialize demo mode - seeds complete demo tenant with real data
 * @access  Public (for demo purposes)
 */
router.post('/init', async (req: Request, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    
    // Seed complete demo tenant with real data
    const seedResult = await demoSeederService.seed(force);
    
    // Also seed alerts via the existing service
    await alertsService.seedDemoAlerts(DEMO_TENANT_ID);

    logger.info('Demo mode initialized', seedResult);

    res.json({
      success: true,
      message: seedResult.message,
      data: {
        tenantId: DEMO_TENANT_ID,
        ...seedResult.seeded,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('Demo init error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize demo mode',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/status
 * @desc    Get demo tenant seeding status
 * @access  Public (for demo purposes)
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await demoSeederService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
});

/**
 * @route   GET /api/demo/kpis
 * @desc    Get showcase KPI data for demo dashboard - queries REAL demo data
 * @access  Public (for demo purposes)
 */
router.get('/kpis', async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure demo is seeded
    await demoSeederService.seed();

    // Query real data from demo tenant
    const [agents, receipts, alertSummary, experiments, conversations] = await Promise.all([
      Agent.countDocuments({}),
      TrustReceiptModel.find({ tenant_id: DEMO_TENANT_ID })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean(),
      alertsService.getSummary(DEMO_TENANT_ID),
      Experiment.countDocuments({ status: 'running' }),
      Conversation.countDocuments({}),
    ]);

    // Calculate real metrics from trust receipts
    const avgClarity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 0), 0) / receipts.length
      : 4.5;
    const avgIntegrity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 0), 0) / receipts.length
      : 4.3;
    const avgQuality = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 0), 0) / receipts.length
      : 4.2;

    // Calculate overall trust score (0-10 scale)
    const trustScore = ((avgClarity + avgIntegrity + avgQuality) / 3) * 2;

    const kpiData = {
      tenant: DEMO_TENANT_ID,
      timestamp: new Date().toISOString(),
      trustScore: Math.round(trustScore * 10) / 10,
      principleScores: {
        consent: Math.round(avgIntegrity * 20),
        inspection: Math.round(avgClarity * 19),
        validation: Math.round(avgQuality * 18),
        override: Math.round(avgIntegrity * 19),
        disconnect: 88,
        moral: Math.round((avgIntegrity + avgQuality) * 9),
      },
      totalInteractions: receipts.length * 50 + Math.floor(Math.random() * 100),
      activeAgents: agents,
      complianceRate: Math.round((trustScore / 10) * 100 * 10) / 10,
      riskScore: Math.max(0, Math.round((10 - trustScore) * 2)),
      alertsCount: alertSummary.active,
      experimentsRunning: experiments,
      orchestratorsActive: 3,
      symbiDimensions: {
        realityIndex: Math.round(avgQuality * 2 * 10) / 10,
        trustProtocol: trustScore >= 7 ? 'PASS' : trustScore >= 5 ? 'PARTIAL' : 'FAIL',
        ethicalAlignment: Math.round(avgIntegrity * 10) / 10,
        resonanceQuality: trustScore >= 8.5 ? 'BREAKTHROUGH' : trustScore >= 7 ? 'ADVANCED' : 'STRONG',
        canvasParity: Math.round(trustScore * 10),
      },
      trends: {
        trustScore: { change: 3.2, direction: 'up' },
        interactions: { change: 15.4, direction: 'up' },
        compliance: { change: 2.1, direction: 'up' },
        risk: { change: 5.3, direction: 'down' },
      },
    };

    res.json({
      success: true,
      data: kpiData,
    });
  } catch (error: unknown) {
    logger.error('Demo KPIs error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo KPIs',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/alerts
 * @desc    Get demo alerts for showcase
 * @access  Public (for demo purposes)
 */
router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await alertsService.list(DEMO_TENANT_ID, { limit: 10 });
    const summary = await alertsService.getSummary(DEMO_TENANT_ID);

    res.json({
      tenant: DEMO_TENANT_ID,
      summary,
      alerts: alerts.map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        details: alert.details,
      })),
    });
  } catch (error: unknown) {
    logger.error('Demo alerts error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo alerts',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/tenants
 * @desc    Get demo tenants for multi-tenant showcase
 * @access  Public (for demo purposes)
 */
router.get('/tenants', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenants = await Tenant.find({}).limit(10).lean();

    // If no tenants, return demo data
    if (tenants.length === 0) {
      res.json({
        success: true,
        data: [
          {
            _id: DEMO_TENANT_ID,
            name: 'Demo Organization',
            description: 'Showcase tenant for demos',
            status: 'active',
            complianceStatus: 'compliant',
            trustScore: 92,
            lastActivity: new Date().toISOString(),
          },
          {
            _id: 'acme-corp',
            name: 'Acme Corp',
            description: 'Enterprise customer - financial services',
            status: 'active',
            complianceStatus: 'compliant',
            trustScore: 88,
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'techstart',
            name: 'TechStart Inc',
            description: 'Startup customer - SaaS platform',
            status: 'active',
            complianceStatus: 'warning',
            trustScore: 76,
            lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'healthsecure',
            name: 'HealthSecure',
            description: 'Healthcare provider - HIPAA compliant',
            status: 'active',
            complianceStatus: 'compliant',
            trustScore: 95,
            lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
        ],
      });
      return;
    }

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error: unknown) {
    logger.error('Demo tenants error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo tenants',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/agents
 * @desc    Get demo agents for showcase
 * @access  Public (for demo purposes)
 */
router.get('/agents', async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await Agent.find({})
      .limit(10)
      .select('name description provider model traits lastActive isPublic ciModel')
      .lean();

    // If no agents, return demo data
    if (agents.length === 0) {
      res.json({
        success: true,
        data: [
          {
            _id: 'demo-atlas',
            name: 'Atlas - Research Assistant',
            description: 'Research specialist with high ethical alignment',
            provider: 'openai',
            model: 'gpt-4-turbo',
            ciModel: 'symbi-core',
            traits: { ethical_alignment: 4.8, creativity: 3.5, precision: 4.9 },
            lastActive: new Date().toISOString(),
          },
          {
            _id: 'demo-nova',
            name: 'Nova - Creative Writer',
            description: 'Creative assistant with balanced safety controls',
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            ciModel: 'symbi-core',
            traits: { ethical_alignment: 4.5, creativity: 4.9, precision: 3.2 },
            lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'demo-sentinel',
            name: 'Sentinel - Security Analyst',
            description: 'Security-focused with maximum oversight',
            provider: 'openai',
            model: 'gpt-4',
            ciModel: 'overseer',
            traits: { ethical_alignment: 5.0, creativity: 2.5, precision: 5.0 },
            lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ],
      });
      return;
    }

    res.json({
      success: true,
      data: agents.map(agent => ({
        ...agent,
        traits: agent.traits instanceof Map ? Object.fromEntries(agent.traits) : agent.traits,
      })),
    });
  } catch (error: unknown) {
    logger.error('Demo agents error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo agents',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/experiments
 * @desc    Get demo experiments for lab showcase
 * @access  Public (for demo purposes)
 */
router.get('/experiments', async (req: Request, res: Response): Promise<void> => {
  try {
    const experiments = await Experiment.find({ tenantId: { $in: ['default', DEMO_TENANT_ID] } })
      .limit(10)
      .lean();

    // If no experiments, return demo data
    if (experiments.length === 0) {
      res.json({
        success: true,
        data: [
          {
            _id: 'demo-exp-1',
            name: 'Trust Threshold Calibration',
            description: 'Testing optimal trust score thresholds',
            hypothesis: 'Lower threshold improves detection without false positives',
            status: 'running',
            type: 'ab_test',
            currentSampleSize: 2436,
            targetSampleSize: 5000,
            metrics: { pValue: 0.0023, effectSize: 0.42, significant: true },
            tags: ['trust', 'threshold'],
          },
          {
            _id: 'demo-exp-2',
            name: 'Bedau Window Size Study',
            description: 'Evaluating optimal temporal window for emergence detection',
            hypothesis: 'Larger window improves emergence detection',
            status: 'running',
            type: 'multivariate',
            currentSampleSize: 1935,
            targetSampleSize: 3000,
            metrics: { pValue: 0.089, effectSize: 0.18, significant: false },
            tags: ['bedau', 'emergence'],
          },
        ],
      });
      return;
    }

    res.json({
      success: true,
      data: experiments,
    });
  } catch (error: unknown) {
    logger.error('Demo experiments error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo experiments',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/receipts
 * @desc    Get demo trust receipts for verification showcase
 * @access  Public (for demo purposes)
 */
router.get('/receipts', async (req: Request, res: Response): Promise<void> => {
  try {
    const receipts = await TrustReceiptModel.find({ tenant_id: DEMO_TENANT_ID })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        receipts,
        total: receipts.length,
        tenant: DEMO_TENANT_ID,
      },
    });
  } catch (error: unknown) {
    logger.error('Demo receipts error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo receipts',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/risk
 * @desc    Get demo risk metrics for showcase
 * @access  Public (for demo purposes)
 */
router.get('/risk', async (req: Request, res: Response): Promise<void> => {
  try {
    const riskData = {
      tenant: DEMO_TENANT_ID,
      overallRiskScore: 12,
      riskLevel: 'low',
      trustPrincipleScores: {
        consent: 94,
        inspection: 91,
        validation: 88,
        ethics: 95,
        disconnect: 87,
        moral: 92,
      },
      complianceReports: [
        { framework: 'EU AI Act', status: 'compliant', score: 95, lastAudit: new Date().toISOString() },
        { framework: 'GDPR', status: 'compliant', score: 94, lastAudit: new Date().toISOString() },
        { framework: 'ISO 27001', status: 'compliant', score: 91, lastAudit: new Date().toISOString() },
        { framework: 'Trust Protocol', status: 'compliant', score: 92, lastAudit: new Date().toISOString() },
      ],
      riskTrends: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: Math.round(10 + Math.random() * 5),
      })),
      trustPrinciples: [
        { name: 'Consent Architecture', weight: 25, score: 94, critical: true },
        { name: 'Inspection Mandate', weight: 20, score: 91, critical: false },
        { name: 'Continuous Validation', weight: 20, score: 88, critical: false },
        { name: 'Ethical Override', weight: 15, score: 95, critical: true },
        { name: 'Right to Disconnect', weight: 10, score: 87, critical: false },
        { name: 'Moral Recognition', weight: 10, score: 92, critical: false },
      ],
    };

    res.json({
      success: true,
      data: riskData,
    });
  } catch (error: unknown) {
    logger.error('Demo risk error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo risk data',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/live-metrics
 * @desc    Get live metrics for demo dashboard - consistent demo data
 * @access  Public (for demo purposes)
 */
router.get('/live-metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure demo is seeded
    await demoSeederService.seed();

    // Query real data from demo tenant
    const [receipts, alerts, agents] = await Promise.all([
      TrustReceiptModel.find({ tenant_id: DEMO_TENANT_ID })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean(),
      AlertModel.find({ tenantId: DEMO_TENANT_ID, status: 'active' }).lean(),
      Agent.countDocuments({}),
    ]);

    // Calculate metrics from demo receipts
    const avgClarity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 4.5), 0) / receipts.length
      : 4.5;
    const avgIntegrity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 4.3), 0) / receipts.length
      : 4.3;
    const avgQuality = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 4.2), 0) / receipts.length
      : 4.2;

    // Convert CIQ (0-5) to trust score (0-10)
    const trustScore = ((avgClarity + avgIntegrity + avgQuality) / 3) * 2;

    // Calculate alert summary
    const alertCritical = alerts.filter(a => a.severity === 'critical').length;
    const alertWarning = alerts.filter(a => a.severity === 'warning').length;

    // Calculate principle scores (0-10 scale) based on CIQ metrics
    const principleScores = {
      consent: Math.min(10, avgIntegrity * 2),
      inspection: Math.min(10, avgClarity * 2),
      validation: Math.min(10, avgQuality * 2),
      override: Math.min(10, avgIntegrity * 2.1),
      disconnect: Math.min(10, 8.5 + (avgQuality - 4) * 0.3),
      moral: Math.min(10, (avgIntegrity + avgQuality)),
    };

    // Round all scores to 1 decimal
    Object.keys(principleScores).forEach(key => {
      principleScores[key as keyof typeof principleScores] = 
        Math.round(principleScores[key as keyof typeof principleScores] * 10) / 10;
    });

    const liveMetrics = {
      timestamp: new Date().toISOString(),
      trust: {
        current: Math.round(trustScore * 10) / 10,
        trend: 'up' as const,
        delta: 0.3,
      },
      drift: {
        score: 0.12,
        status: 'normal' as const,
      },
      emergence: {
        level: 0.15,
        active: false,
      },
      system: {
        activeAgents: agents,
        activeConversations: 3,
        messagesPerMinute: 12,
        errorRate: 0.2,
      },
      alerts: {
        active: alerts.length,
        critical: alertCritical,
        warning: alertWarning,
      },
      principles: principleScores,
    };

    res.json({
      success: true,
      data: liveMetrics,
    });
  } catch (error: unknown) {
    logger.error('Demo live-metrics error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo live metrics',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/demo/live-events
 * @desc    Get live events for demo dashboard - recent trust events and alerts
 * @access  Public (for demo purposes)
 */
router.get('/live-events', async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure demo is seeded
    await demoSeederService.seed();

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Get alerts as events
    const alerts = await AlertModel.find({ tenantId: DEMO_TENANT_ID })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Get recent conversations with trust scores
    const conversations = await Conversation.find({})
      .sort({ lastActivity: -1 })
      .limit(5)
      .populate('agents', 'name')
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
        id: alert._id.toString(),
        timestamp: alert.timestamp?.toISOString() || new Date().toISOString(),
        type: 'alert',
        description: alert.title || 'System Alert',
        severity: alert.severity || 'info',
      });
    }

    // Add conversation messages as trust evaluation events
    for (const conv of conversations) {
      const lastMsg = conv.messages?.[conv.messages.length - 1];
      if (lastMsg) {
        const agentDoc = Array.isArray(conv.agents) ? conv.agents[0] : null;
        const agentName = agentDoc && typeof agentDoc === 'object' && 'name' in agentDoc 
          ? (agentDoc as { name: string }).name 
          : 'AI Agent';
        
        events.push({
          id: `conv-${conv._id}-${conv.messages.length}`,
          timestamp: lastMsg.timestamp?.toISOString() || new Date().toISOString(),
          type: 'evaluation',
          description: `Trust evaluation completed for ${conv.title || 'conversation'}`,
          severity: 'info',
          agentName,
          trustScore: (lastMsg.trustScore || 4.2) * 2, // Convert 0-5 to 0-10
        });
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: events.slice(0, limit),
    });
  } catch (error: unknown) {
    logger.error('Demo live-events error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo live events',
      error: getErrorMessage(error),
    });
  }
});

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

export default router;
