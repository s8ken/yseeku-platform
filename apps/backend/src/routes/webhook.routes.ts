import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { webhookService } from '../services/webhook.service';
import { AlertSeverity, WebhookChannel } from '../models/webhook-config.model';
import { logger } from '../utils/logger';

/**
 * Webhook Configuration Routes
 * /api/webhooks
 */

const router = Router();

// ==================== Validation Schemas ====================

const channelSchema = z.object({
  type: z.enum(['webhook', 'email', 'slack', 'pagerduty', 'teams', 'discord']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT', 'PATCH']).optional().default('POST'),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().optional().default(true),
});

const conditionSchema = z.object({
  metric: z.string().min(1),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq']),
  threshold: z.number(),
  timeWindowMs: z.number().optional(),
});

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  conditions: z.array(conditionSchema).min(1),
  severity: z.enum(['critical', 'error', 'warning', 'info']).optional(),
  enabled: z.boolean().optional().default(true),
});

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  channels: z.array(channelSchema).min(1),
  rules: z.array(ruleSchema).optional(),
  eventTypes: z.array(z.string()).optional(),
  severityFilter: z.array(z.enum(['critical', 'error', 'warning', 'info'])).optional(),
  secret: z.string().optional(),
  rateLimiting: z.object({
    enabled: z.boolean(),
    maxPerMinute: z.number().min(1).max(1000).optional(),
    maxPerHour: z.number().min(1).max(10000).optional(),
  }).optional(),
  retryConfig: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    initialDelayMs: z.number().min(100).optional(),
    maxDelayMs: z.number().optional(),
    timeoutMs: z.number().min(1000).max(60000).optional(),
  }).optional(),
  enabled: z.boolean().optional().default(true),
});

const updateWebhookSchema = createWebhookSchema.partial();

// ==================== Middleware ====================

// Get tenant ID from authenticated user or default
const getTenantId = (req: Request): string => {
  return (req as any).user?.tenantId || 'default';
};

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// ==================== Routes ====================

/**
 * GET /api/webhooks
 * List all webhook configurations for the tenant
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const configs = await webhookService.listConfigs(tenantId);
    
    res.json({
      data: configs.map(config => ({
        id: config._id,
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        channelCount: config.channels?.length || 0,
        ruleCount: config.rules?.length || 0,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      })),
      total: configs.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook configuration
 */
router.post(
  '/',
  validate(createWebhookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = getTenantId(req);
      
      // Generate IDs for rules
      const rules = req.body.rules?.map((rule: any, index: number) => ({
        ...rule,
        id: rule.id || `rule-${Date.now()}-${index}`,
      }));
      
      const config = await webhookService.createConfig({
        ...req.body,
        rules,
        tenantId,
      });
      
      res.status(201).json({
        message: 'Webhook configuration created',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/webhooks/:id
 * Get a specific webhook configuration
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await webhookService.getConfig(req.params.id);
    
    if (!config) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    // Check tenant access
    if (config.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/webhooks/:id
 * Update a webhook configuration
 */
router.put(
  '/:id',
  validate(updateWebhookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await webhookService.getConfig(req.params.id);
      
      if (!existing) {
        res.status(404).json({ error: 'Webhook configuration not found' });
        return;
      }
      
      if (existing.tenantId !== getTenantId(req)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      
      // Generate IDs for new rules
      if (req.body.rules) {
        req.body.rules = req.body.rules.map((rule: any, index: number) => ({
          ...rule,
          id: rule.id || `rule-${Date.now()}-${index}`,
        }));
      }
      
      const config = await webhookService.updateConfig(req.params.id, req.body);
      
      res.json({
        message: 'Webhook configuration updated',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook configuration
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await webhookService.getConfig(req.params.id);
    
    if (!existing) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    if (existing.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    await webhookService.deleteConfig(req.params.id);
    
    res.json({ message: 'Webhook configuration deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test a webhook configuration by sending a test payload
 */
router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await webhookService.getConfig(req.params.id);
    
    if (!existing) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    if (existing.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get first channel for testing
    const channel = existing.channels?.[0];
    if (!channel || channel === 'email') {
      res.status(400).json({ error: 'No valid channel configured for testing' });
      return;
    }
    
    const result = await webhookService.testWebhook(req.params.id);
    
    res.json({
      message: result.success ? 'Test webhook delivered successfully' : 'Test webhook failed',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/:id/toggle
 * Enable or disable a webhook configuration
 */
router.post('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await webhookService.getConfig(req.params.id);
    
    if (!existing) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    if (existing.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const config = await webhookService.updateConfig(req.params.id, {
      enabled: !existing.enabled,
    });
    
    res.json({
      message: `Webhook ${config?.enabled ? 'enabled' : 'disabled'}`,
      data: { enabled: config?.enabled },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get delivery history for a webhook configuration
 */
router.get('/:id/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await webhookService.getConfig(req.params.id);
    
    if (!existing) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    if (existing.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const deliveries = await webhookService.getDeliveryHistory(req.params.id, limit);
    
    res.json({
      data: deliveries.map(d => ({
        id: d._id,
        alertType: d.alertType,
        alertSeverity: d.alertSeverity,
        ruleName: d.ruleName,
        status: d.status,
        attempt: d.attempt,
        responseStatus: d.responseStatus,
        responseTime: d.responseTime,
        error: d.error,
        createdAt: d.createdAt,
        deliveredAt: d.deliveredAt,
      })),
      total: deliveries.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id/stats
 * Get delivery statistics for a webhook configuration
 */
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await webhookService.getConfig(req.params.id);
    
    if (!existing) {
      res.status(404).json({ error: 'Webhook configuration not found' });
      return;
    }
    
    if (existing.tenantId !== getTenantId(req)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const hours = parseInt(req.query.hours as string) || 24;
    const stats = await webhookService.getDeliveryStats(req.params.id, hours);
    
    res.json({
      data: {
        ...stats,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
        timeRange: `${hours}h`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Alert Event Types ====================

/**
 * GET /api/webhooks/meta/event-types
 * Get available alert event types
 */
router.get('/meta/event-types', (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: 'trust_low', name: 'Trust Score Low', description: 'Trust score dropped below threshold' },
      { id: 'trust_critical', name: 'Trust Critical', description: 'Trust score critically low' },
      { id: 'drift_detected', name: 'Drift Detected', description: 'Behavioral drift detected' },
      { id: 'drift_critical', name: 'Critical Drift', description: 'Critical drift threshold exceeded' },
      { id: 'emergence_warning', name: 'Emergence Warning', description: 'Agent emergence detected' },
      { id: 'consent_revoked', name: 'Consent Revoked', description: 'User revoked consent' },
      { id: 'ethical_override', name: 'Ethical Override', description: 'Ethical override triggered' },
      { id: 'principle_violation', name: 'Principle Violation', description: 'SYMBI principle violated' },
      { id: 'security_alert', name: 'Security Alert', description: 'Security issue detected' },
      { id: 'system_health', name: 'System Health', description: 'System health issue' },
      { id: 'anomaly_detected', name: 'Anomaly Detected', description: 'Statistical anomaly in metrics' },
    ],
  });
});

/**
 * GET /api/webhooks/meta/metrics
 * Get available metrics for rule conditions
 */
router.get('/meta/metrics', (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: 'trustScore', name: 'Trust Score', description: 'Overall trust score (0-1)', unit: 'score' },
      { id: 'driftScore', name: 'Drift Score', description: 'Behavioral drift magnitude (0-1)', unit: 'score' },
      { id: 'emergenceLevel', name: 'Emergence Level', description: 'Agent emergence metric (0-1)', unit: 'level' },
      { id: 'bedauIndex', name: 'Bedau Index', description: 'Emergent behavior complexity (0-1)', unit: 'index' },
      { id: 'principleScore', name: 'Principle Score', description: 'SYMBI compliance score (0-1)', unit: 'score' },
      { id: 'consentRate', name: 'Consent Rate', description: 'User consent percentage (0-100)', unit: 'percent' },
      { id: 'alertCount', name: 'Alert Count', description: 'Number of active alerts', unit: 'count' },
      { id: 'errorRate', name: 'Error Rate', description: 'API error rate (0-100)', unit: 'percent' },
      { id: 'latencyP95', name: 'Latency P95', description: '95th percentile latency', unit: 'ms' },
    ],
  });
});

export default router;
