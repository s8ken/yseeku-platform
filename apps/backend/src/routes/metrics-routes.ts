/**
 * Prometheus Metrics Routes
 * 
 * GET /metrics - Prometheus-compatible metrics endpoint
 */

import { Router, Request, Response } from 'express';
import { getMetrics, getMetricsData } from '../middleware/metrics';

const router = Router();

/**
 * GET /metrics
 * Returns Prometheus-formatted metrics
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(await getMetrics());
  } catch (err) {
    console.error('Error generating metrics:', err);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

/**
 * GET /metrics/data
 * Returns JSON-formatted metrics data (easier to parse)
 */
router.get('/data', (_req: Request, res: Response): void => {
  try {
    const data = getMetricsData();
    res.json(data);
  } catch (err) {
    console.error('Error getting metrics data:', err);
    res.status(500).json({ error: 'Failed to get metrics data' });
  }
});

/**
 * GET /metrics/health
 * Quick health check with basic metrics
 */
router.get('/health', (_req: Request, res: Response): void => {
  try {
    const data = getMetricsData();
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics: {
        evaluationCount: data.evaluationCount,
        violationCount: data.violationCount,
        alertCount: data.alertCount,
        averageEvaluationTimeMs: Math.round(data.averageEvaluationTime * 100) / 100,
      },
    };
    res.json(health);
  } catch (err) {
    console.error('Error getting metrics health:', err);
    res.status(500).json({ error: 'Failed to get metrics health' });
  }
});

export default router;
