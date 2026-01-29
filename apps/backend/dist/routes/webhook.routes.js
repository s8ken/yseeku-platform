"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const webhook_service_1 = require("../services/webhook.service");
/**
 * Webhook Configuration Routes
 * /api/webhooks
 */
const router = (0, express_1.Router)();
// ==================== Validation Schemas ====================
const channelSchema = zod_1.z.object({
    type: zod_1.z.enum(['webhook', 'email', 'slack', 'pagerduty', 'teams', 'discord']),
    name: zod_1.z.string().min(1).max(100),
    url: zod_1.z.string().url(),
    method: zod_1.z.enum(['POST', 'PUT', 'PATCH']).optional().default('POST'),
    headers: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    enabled: zod_1.z.boolean().optional().default(true),
});
const conditionSchema = zod_1.z.object({
    metric: zod_1.z.string().min(1),
    operator: zod_1.z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq']),
    threshold: zod_1.z.number(),
    timeWindowMs: zod_1.z.number().optional(),
});
const ruleSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    conditions: zod_1.z.array(conditionSchema).min(1),
    severity: zod_1.z.enum(['critical', 'error', 'warning', 'info']).optional(),
    enabled: zod_1.z.boolean().optional().default(true),
});
const createWebhookSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    channels: zod_1.z.array(channelSchema).min(1),
    rules: zod_1.z.array(ruleSchema).optional(),
    eventTypes: zod_1.z.array(zod_1.z.string()).optional(),
    severityFilter: zod_1.z.array(zod_1.z.enum(['critical', 'error', 'warning', 'info'])).optional(),
    secret: zod_1.z.string().optional(),
    rateLimiting: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        maxPerMinute: zod_1.z.number().min(1).max(1000).optional(),
        maxPerHour: zod_1.z.number().min(1).max(10000).optional(),
    }).optional(),
    retryConfig: zod_1.z.object({
        maxRetries: zod_1.z.number().min(0).max(10).optional(),
        initialDelayMs: zod_1.z.number().min(100).optional(),
        maxDelayMs: zod_1.z.number().optional(),
        timeoutMs: zod_1.z.number().min(1000).max(60000).optional(),
    }).optional(),
    enabled: zod_1.z.boolean().optional().default(true),
});
const updateWebhookSchema = createWebhookSchema.partial();
// ==================== Middleware ====================
// Get tenant ID from authenticated user or default
const getTenantId = (req) => {
    return req.user?.tenantId || 'default';
};
// Validation middleware
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.issues.map(e => ({
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
router.get('/', async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        const configs = await webhook_service_1.webhookService.listConfigs(tenantId);
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/webhooks
 * Create a new webhook configuration
 */
router.post('/', validate(createWebhookSchema), async (req, res, next) => {
    try {
        const tenantId = getTenantId(req);
        // Generate IDs for rules
        const rules = req.body.rules?.map((rule, index) => ({
            ...rule,
            id: rule.id || `rule-${Date.now()}-${index}`,
        }));
        const config = await webhook_service_1.webhookService.createConfig({
            ...req.body,
            rules,
            tenantId,
        });
        res.status(201).json({
            message: 'Webhook configuration created',
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/webhooks/:id
 * Get a specific webhook configuration
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const config = await webhook_service_1.webhookService.getConfig(id);
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/webhooks/:id
 * Update a webhook configuration
 */
router.put('/:id', validate(updateWebhookSchema), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
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
            req.body.rules = req.body.rules.map((rule, index) => ({
                ...rule,
                id: rule.id || `rule-${Date.now()}-${index}`,
            }));
        }
        const config = await webhook_service_1.webhookService.updateConfig(id, req.body);
        res.json({
            message: 'Webhook configuration updated',
            data: config,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/webhooks/:id
 * Delete a webhook configuration
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
        if (!existing) {
            res.status(404).json({ error: 'Webhook configuration not found' });
            return;
        }
        if (existing.tenantId !== getTenantId(req)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        await webhook_service_1.webhookService.deleteConfig(id);
        res.json({ message: 'Webhook configuration deleted' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/webhooks/:id/test
 * Test a webhook configuration by sending a test payload
 */
router.post('/:id/test', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
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
        const result = await webhook_service_1.webhookService.testWebhook(id);
        res.json({
            message: result.success ? 'Test webhook delivered successfully' : 'Test webhook failed',
            ...result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/webhooks/:id/toggle
 * Enable or disable a webhook configuration
 */
router.post('/:id/toggle', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
        if (!existing) {
            res.status(404).json({ error: 'Webhook configuration not found' });
            return;
        }
        if (existing.tenantId !== getTenantId(req)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const config = await webhook_service_1.webhookService.updateConfig(id, {
            enabled: !existing.enabled,
        });
        res.json({
            message: `Webhook ${config?.enabled ? 'enabled' : 'disabled'}`,
            data: { enabled: config?.enabled },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/webhooks/:id/deliveries
 * Get delivery history for a webhook configuration
 */
router.get('/:id/deliveries', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
        if (!existing) {
            res.status(404).json({ error: 'Webhook configuration not found' });
            return;
        }
        if (existing.tenantId !== getTenantId(req)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const deliveries = await webhook_service_1.webhookService.getDeliveryHistory(id, limit);
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/webhooks/:id/stats
 * Get delivery statistics for a webhook configuration
 */
router.get('/:id/stats', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const existing = await webhook_service_1.webhookService.getConfig(id);
        if (!existing) {
            res.status(404).json({ error: 'Webhook configuration not found' });
            return;
        }
        if (existing.tenantId !== getTenantId(req)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const hours = parseInt(req.query.hours) || 24;
        const stats = await webhook_service_1.webhookService.getDeliveryStats(id, hours);
        res.json({
            data: {
                ...stats,
                successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
                timeRange: `${hours}h`,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== Alert Event Types ====================
/**
 * GET /api/webhooks/meta/event-types
 * Get available alert event types
 */
router.get('/meta/event-types', (_req, res) => {
    res.json({
        data: [
            { id: 'trust_low', name: 'Trust Score Low', description: 'Trust score dropped below threshold' },
            { id: 'trust_critical', name: 'Trust Critical', description: 'Trust score critically low' },
            { id: 'drift_detected', name: 'Drift Detected', description: 'Behavioral drift detected' },
            { id: 'drift_critical', name: 'Critical Drift', description: 'Critical drift threshold exceeded' },
            { id: 'emergence_warning', name: 'Emergence Warning', description: 'Agent emergence detected' },
            { id: 'consent_revoked', name: 'Consent Revoked', description: 'User revoked consent' },
            { id: 'ethical_override', name: 'Ethical Override', description: 'Ethical override triggered' },
            { id: 'principle_violation', name: 'Principle Violation', description: 'SONATE principle violated' },
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
router.get('/meta/metrics', (_req, res) => {
    res.json({
        data: [
            { id: 'trustScore', name: 'Trust Score', description: 'Overall trust score (0-1)', unit: 'score' },
            { id: 'driftScore', name: 'Drift Score', description: 'Behavioral drift magnitude (0-1)', unit: 'score' },
            { id: 'emergenceLevel', name: 'Emergence Level', description: 'Agent emergence metric (0-1)', unit: 'level' },
            { id: 'bedauIndex', name: 'Bedau Index', description: 'Emergent behavior complexity (0-1)', unit: 'index' },
            { id: 'principleScore', name: 'Principle Score', description: 'SONATE compliance score (0-1)', unit: 'score' },
            { id: 'consentRate', name: 'Consent Rate', description: 'User consent percentage (0-100)', unit: 'percent' },
            { id: 'alertCount', name: 'Alert Count', description: 'Number of active alerts', unit: 'count' },
            { id: 'errorRate', name: 'Error Rate', description: 'API error rate (0-100)', unit: 'percent' },
            { id: 'latencyP95', name: 'Latency P95', description: '95th percentile latency', unit: 'ms' },
        ],
    });
});
exports.default = router;
