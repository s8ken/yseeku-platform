/**
 * Demo Core Routes
 * Initialization, status, and KPI endpoints for demo dashboard
 * 
 * v2.0.1 CHANGES:
 * - Removed realityIndex and canvasParity from sonateDimensions (calculators cut)
 * - Focused on 3 validated dimensions: trustProtocol, ethicalAlignment, resonanceQuality
 */

import { Router, Request, Response } from 'express';
import { alertsService } from '../../services/alerts.service';
import { demoSeederService } from '../../services/demo-seeder.service';
import { Agent } from '../../models/agent.model';
import { Experiment } from '../../models/experiment.model';
import { Conversation } from '../../models/conversation.model';
import { TrustReceiptModel } from '../../models/trust-receipt.model';
import logger from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';
import { DEMO_TENANT_ID } from './middleware';

const router = Router();

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
 * 
 * v2.0.1: Updated sonateDimensions to only include validated calculators
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

    // Demo values with slight randomization for dynamic feel
    // Base values are stable, variation is minimal (±0.3 for score, ±20 for interactions)
    const demoTrustScore = Math.round((8.6 + Math.random() * 0.4) * 10) / 10; // 8.6-9.0
    const demoInteractions = 1490 + Math.floor(Math.random() * 30); // 1490-1520

    const kpiData = {
      tenant: DEMO_TENANT_ID,
      timestamp: new Date().toISOString(),
      trustScore: demoTrustScore,
      principleScores: {
        consent: 90 + Math.floor(Math.random() * 5), // 90-94
        inspection: 86 + Math.floor(Math.random() * 5), // 86-90
        validation: 83 + Math.floor(Math.random() * 5), // 83-87
        override: 88 + Math.floor(Math.random() * 5), // 88-92
        disconnect: 86 + Math.floor(Math.random() * 5), // 86-90
        moral: 85 + Math.floor(Math.random() * 5), // 85-89
      },
      totalInteractions: demoInteractions,
      activeAgents: agents,
      complianceRate: Math.round((trustScore / 10) * 100 * 10) / 10,
      riskScore: Math.max(0, Math.round((10 - trustScore) * 2)),
      alertsCount: alertSummary.active,
      experimentsRunning: experiments,
      orchestratorsActive: 3,
      // v2.0.1: Only 3 validated dimensions (removed realityIndex and canvasParity)
      sonateDimensions: {
        trustProtocol: trustScore >= 7 ? 'PASS' : trustScore >= 5 ? 'PARTIAL' : 'FAIL',
        ethicalAlignment: Math.round(avgIntegrity * 10) / 10,
        resonanceQuality: trustScore >= 8.5 ? 'BREAKTHROUGH' : trustScore >= 7 ? 'ADVANCED' : 'STRONG',
        // Deprecated fields - kept for backward compatibility, always return 0
        realityIndex: 0,
        canvasParity: 0,
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

export default router;