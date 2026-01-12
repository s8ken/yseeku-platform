/**
 * Demo Routes - Investor Showcase Data
 *
 * These routes provide pre-populated showcase data for demos to investors
 * and potential customers. They use the demo tenant and don't require
 * authentication for easy access during presentations.
 */

import { Router, Request, Response } from 'express';
import { alertsService } from '../services/alerts.service';
import { Tenant } from '../models/tenant.model';
import { Agent } from '../models/agent.model';
import { Conversation } from '../models/conversation.model';
import { Experiment } from '../models/experiment.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';

const router = Router();

const DEMO_TENANT_ID = 'demo-tenant';

/**
 * @route   POST /api/demo/init
 * @desc    Initialize demo mode - seeds alerts and refreshes demo data
 * @access  Public (for demo purposes)
 */
router.post('/init', async (req: Request, res: Response): Promise<void> => {
  try {
    // Seed demo alerts
    alertsService.seedDemoAlerts();

    logger.info('Demo mode initialized');

    res.json({
      success: true,
      message: 'Demo mode initialized',
      data: {
        tenantId: DEMO_TENANT_ID,
        alertsSeeded: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Demo init error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to initialize demo mode',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/demo/kpis
 * @desc    Get showcase KPI data for demo dashboard
 * @access  Public (for demo purposes)
 */
router.get('/kpis', async (req: Request, res: Response): Promise<void> => {
  try {
    // Return impressive demo KPIs
    const kpiData = {
      tenant: DEMO_TENANT_ID,
      timestamp: new Date().toISOString(),
      trustScore: 92.3,
      principleScores: {
        transparency: 94,
        fairness: 91,
        privacy: 89,
        safety: 95,
        accountability: 90,
      },
      totalInteractions: 12847,
      activeAgents: 5,
      complianceRate: 98.2,
      riskScore: 8,
      alertsCount: alertsService.getSummary().active,
      experimentsRunning: 2,
      orchestratorsActive: 3,
      symbiDimensions: {
        realityIndex: 8.7,
        trustProtocol: 'PASS',
        ethicalAlignment: 4.6,
        resonanceQuality: 'ADVANCED',
        canvasParity: 95,
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
  } catch (error: any) {
    logger.error('Demo KPIs error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo KPIs',
      error: error.message,
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
    const alerts = alertsService.list();
    const summary = alertsService.getSummary();

    res.json({
      tenant: DEMO_TENANT_ID,
      summary,
      alerts: alerts.slice(0, 10).map(alert => ({
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
  } catch (error: any) {
    logger.error('Demo alerts error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo alerts',
      error: error.message,
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
  } catch (error: any) {
    logger.error('Demo tenants error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo tenants',
      error: error.message,
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
            model: 'claude-3-sonnet',
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
  } catch (error: any) {
    logger.error('Demo agents error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo agents',
      error: error.message,
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
  } catch (error: any) {
    logger.error('Demo experiments error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo experiments',
      error: error.message,
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
  } catch (error: any) {
    logger.error('Demo receipts error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo receipts',
      error: error.message,
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
  } catch (error: any) {
    logger.error('Demo risk error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo risk data',
      error: error.message,
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
  } catch (error: any) {
    logger.error('Demo overseer error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo overseer data',
      error: error.message,
    });
  }
});

export default router;
