/**
 * Monitoring & Metrics Routes
 * Prometheus-style metrics and system health endpoints
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { getMetrics } from '../observability/metrics';
import { trace } from '@opentelemetry/api';
import { getErrorMessage, getErrorStack } from '../utils/error-utils';

const router = Router();

// Store server start time for uptime calculation
const SERVER_START_TIME = Date.now();

// In-memory metrics store (in production, use Prometheus client)
interface Metrics {
  [key: string]: number;
}

const metrics: Metrics = {
  sonate_trust_receipts_total: 0,
  sonate_trust_verifications_total: 0,
  sonate_resonance_receipts_total: 0,
  sonate_active_workflows: 0,
  sonate_active_agents: 0,
  sonate_security_alerts_total: 0,
  sonate_http_requests_total: 0,
  sonate_workflow_failures_total: 0,
  sonate_auth_failures_total: 0,
  sonate_agent_operations_total: 0,
  sonate_cache_operations_total: 0,
  sonate_external_api_calls_total: 0,
  sonate_rate_limit_hits_total: 0,
};

/**
 * Increment a metric counter
 */
export function incrementMetric(name: string, value: number = 1) {
  if (metrics[name] !== undefined) {
    metrics[name] += value;
  }
}

/**
 * Set a gauge metric value
 */
export function setMetric(name: string, value: number) {
  metrics[name] = value;
}

/**
 * @route   GET /api/metrics
 * @desc    Get Prometheus-style metrics
 * @access  Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const output = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(output);
  } catch (error: unknown) {
    logger.error('Metrics generation error', {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * @route   GET /api/health
 * @desc    Enhanced health check with system details
 * @access  Public
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculate uptime
    const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

    // Check database connection
    let databaseStatus: 'up' | 'down' = 'down';
    let databaseLatency: number | undefined;
    let databaseError: string | undefined;

    const dbStartTime = Date.now();
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        databaseStatus = 'up';
        databaseLatency = Date.now() - dbStartTime;
      } else {
        databaseError = 'Database not connected';
      }
    } catch (err: unknown) {
      databaseError = getErrorMessage(err) || 'Database ping failed';
    }

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMemMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memPercentage = Math.round((usedMemMB / totalMemMB) * 100);

    let memStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (memPercentage > 90) memStatus = 'critical';
    else if (memPercentage > 75) memStatus = 'warning';

    // Overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (databaseStatus === 'down') overallStatus = 'unhealthy';
    else if (memStatus === 'critical') overallStatus = 'degraded';
    else if (memStatus === 'warning') overallStatus = 'degraded';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.11.1',
      uptime: uptimeSeconds,
      checks: {
        database: {
          status: databaseStatus,
          latency: databaseLatency,
          error: databaseError,
        },
        memory: {
          status: memStatus,
          used: usedMemMB,
          total: totalMemMB,
          percentage: memPercentage,
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Health check error', {
      error: getErrorMessage(error),
      stack: getErrorStack(error),
    });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: 'unknown',
      uptime: 0,
      checks: {
        database: {
          status: 'down',
          error: getErrorMessage(error),
        },
        memory: {
          status: 'critical',
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    });
  }
});

/**
 * @route   GET /api/observability/test-trace
 * @desc    Generate a sanity trace to verify OTEL/Jaeger wiring
 * @access  Public
 */
router.get('/observability/test-trace', async (req: Request, res: Response): Promise<void> => {
  try {
    const tracer = trace.getTracer('yseeku-backend');
    const span = tracer.startSpan('sanity_trace', {
      attributes: {
        component: 'backend',
        route: '/api/observability/test-trace',
      }
    });
    span.addEvent('sanity_trace_start');
    await new Promise(resolve => setTimeout(resolve, 50));
    span.addEvent('sanity_trace_end');
    span.end();
    res.json({ success: true, message: 'Trace emitted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to emit trace', error: getErrorMessage(error) });
  }
});

export default router;
export { metrics };
