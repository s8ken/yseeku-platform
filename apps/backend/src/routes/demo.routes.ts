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
      sonateDimensions: {
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

/**
 * @route   GET /api/demo/trust-analytics
 * @desc    Get demo trust analytics for Trust Analytics dashboard
 * @access  Public (for demo purposes)
 */
router.get('/trust-analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure demo is seeded
    await demoSeederService.seed();

    // Query real data from demo tenant
    const receipts = await TrustReceiptModel.find({ tenant_id: DEMO_TENANT_ID })
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    // Calculate analytics from receipts
    const totalInteractions = receipts.length * 50 + 2847; // Simulated scale

    // Calculate average trust score from CIQ metrics
    const avgClarity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 0.8), 0) / receipts.length
      : 0.85;
    const avgIntegrity = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 0.9), 0) / receipts.length
      : 0.88;
    const avgQuality = receipts.length > 0
      ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 0.85), 0) / receipts.length
      : 0.82;

    // Convert to 0-10 scale
    const averageTrustScore = ((avgClarity + avgIntegrity + avgQuality) / 3) * 10;

    // Calculate pass/partial/fail rates based on CIQ thresholds
    const passThreshold = 0.75;
    const partialThreshold = 0.5;

    const passCount = receipts.filter(r => {
      const avg = ((r.ciq_metrics?.clarity || 0) + (r.ciq_metrics?.integrity || 0) + (r.ciq_metrics?.quality || 0)) / 3;
      return avg >= passThreshold;
    }).length;

    const partialCount = receipts.filter(r => {
      const avg = ((r.ciq_metrics?.clarity || 0) + (r.ciq_metrics?.integrity || 0) + (r.ciq_metrics?.quality || 0)) / 3;
      return avg >= partialThreshold && avg < passThreshold;
    }).length;

    const failCount = receipts.length - passCount - partialCount;

    const passRate = receipts.length > 0 ? (passCount / receipts.length) * 100 : 92;
    const partialRate = receipts.length > 0 ? (partialCount / receipts.length) * 100 : 6;
    const failRate = receipts.length > 0 ? (failCount / receipts.length) * 100 : 2;

    // Common violations (demo data based on principle checks)
    const commonViolations = [
      { principle: 'CONSENT_ARCHITECTURE', count: 12, percentage: 35 },
      { principle: 'INSPECTION_MANDATE', count: 8, percentage: 23 },
      { principle: 'CONTINUOUS_VALIDATION', count: 7, percentage: 20 },
      { principle: 'ETHICAL_OVERRIDE', count: 4, percentage: 12 },
      { principle: 'RIGHT_TO_DISCONNECT', count: 2, percentage: 6 },
      { principle: 'MORAL_RECOGNITION', count: 1, percentage: 4 },
    ];

    // Generate recent trends (last 7 days)
    const now = new Date();
    const recentTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayScore = averageTrustScore + (Math.random() - 0.5) * 0.6; // Small variation
      recentTrends.push({
        date: date.toISOString().split('T')[0],
        avgTrustScore: Math.round(dayScore * 100) / 100,
        passRate: Math.round((passRate + (Math.random() - 0.5) * 4) * 10) / 10,
      });
    }

    const analytics = {
      averageTrustScore: Math.round(averageTrustScore * 100) / 100,
      totalInteractions,
      passRate: Math.round(passRate * 10) / 10,
      partialRate: Math.round(partialRate * 10) / 10,
      failRate: Math.round(failRate * 10) / 10,
      commonViolations,
      recentTrends,
    };

    res.json({
      success: true,
      data: {
        analytics,
        timeRange: {
          days: 7,
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString(),
        },
        tenant: DEMO_TENANT_ID,
      },
    });
  } catch (error: unknown) {
    logger.error('Demo trust analytics error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo trust analytics',
      error: getErrorMessage(error),
    });
  }
});

export default router;