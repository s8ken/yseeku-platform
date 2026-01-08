/**
 * Monitoring & Metrics Routes
 * Prometheus-style metrics and system health endpoints
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

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
    // Generate Prometheus text format
    let output = '';

    // Add metadata
    output += '# HELP sonate_trust_receipts_total Total number of trust receipts generated\n';
    output += '# TYPE sonate_trust_receipts_total counter\n';
    output += `sonate_trust_receipts_total ${metrics.sonate_trust_receipts_total}\n\n`;

    output += '# HELP sonate_trust_verifications_total Total number of trust verifications performed\n';
    output += '# TYPE sonate_trust_verifications_total counter\n';
    output += `sonate_trust_verifications_total ${metrics.sonate_trust_verifications_total}\n\n`;

    output += '# HELP sonate_resonance_receipts_total Total number of resonance receipts generated\n';
    output += '# TYPE sonate_resonance_receipts_total counter\n';
    output += `sonate_resonance_receipts_total ${metrics.sonate_resonance_receipts_total}\n\n`;

    output += '# HELP sonate_active_workflows Number of currently active workflows\n';
    output += '# TYPE sonate_active_workflows gauge\n';
    output += `sonate_active_workflows ${metrics.sonate_active_workflows}\n\n`;

    output += '# HELP sonate_active_agents Number of currently active agents\n';
    output += '# TYPE sonate_active_agents gauge\n';
    output += `sonate_active_agents ${metrics.sonate_active_agents}\n\n`;

    output += '# HELP sonate_security_alerts_total Total number of security alerts\n';
    output += '# TYPE sonate_security_alerts_total counter\n';
    output += `sonate_security_alerts_total ${metrics.sonate_security_alerts_total}\n\n`;

    output += '# HELP sonate_http_requests_total Total number of HTTP requests\n';
    output += '# TYPE sonate_http_requests_total counter\n';
    output += `sonate_http_requests_total ${metrics.sonate_http_requests_total}\n\n`;

    output += '# HELP sonate_workflow_failures_total Total number of workflow failures\n';
    output += '# TYPE sonate_workflow_failures_total counter\n';
    output += `sonate_workflow_failures_total ${metrics.sonate_workflow_failures_total}\n\n`;

    output += '# HELP sonate_auth_failures_total Total number of authentication failures\n';
    output += '# TYPE sonate_auth_failures_total counter\n';
    output += `sonate_auth_failures_total ${metrics.sonate_auth_failures_total}\n\n`;

    output += '# HELP sonate_agent_operations_total Total number of agent operations\n';
    output += '# TYPE sonate_agent_operations_total counter\n';
    output += `sonate_agent_operations_total ${metrics.sonate_agent_operations_total}\n\n`;

    output += '# HELP sonate_cache_operations_total Total number of cache operations\n';
    output += '# TYPE sonate_cache_operations_total counter\n';
    output += `sonate_cache_operations_total ${metrics.sonate_cache_operations_total}\n\n`;

    output += '# HELP sonate_external_api_calls_total Total number of external API calls\n';
    output += '# TYPE sonate_external_api_calls_total counter\n';
    output += `sonate_external_api_calls_total ${metrics.sonate_external_api_calls_total}\n\n`;

    output += '# HELP sonate_rate_limit_hits_total Total number of rate limit hits\n';
    output += '# TYPE sonate_rate_limit_hits_total counter\n';
    output += `sonate_rate_limit_hits_total ${metrics.sonate_rate_limit_hits_total}\n\n`;

    output += '# HELP sonate_trust_score Trust score histogram\n';
    output += '# TYPE sonate_trust_score histogram\n';
    output += `sonate_trust_score_sum 0\n`;
    output += `sonate_trust_score_count 0\n\n`;

    output += '# HELP sonate_workflow_duration_seconds Workflow duration histogram\n';
    output += '# TYPE sonate_workflow_duration_seconds histogram\n';
    output += `sonate_workflow_duration_seconds_sum 0\n`;
    output += `sonate_workflow_duration_seconds_count 0\n\n`;

    output += '# HELP sonate_db_query_duration_seconds Database query duration histogram\n';
    output += '# TYPE sonate_db_query_duration_seconds histogram\n';
    output += `sonate_db_query_duration_seconds_sum 0\n`;
    output += `sonate_db_query_duration_seconds_count 0\n\n`;

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(output);
  } catch (error: any) {
    logger.error('Metrics generation error', {
      error: error.message,
      stack: error.stack,
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
    } catch (err: any) {
      databaseError = err.message || 'Database ping failed';
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
  } catch (error: any) {
    logger.error('Health check error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: 'unknown',
      uptime: 0,
      checks: {
        database: {
          status: 'down',
          error: error.message,
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

export default router;
export { metrics };
