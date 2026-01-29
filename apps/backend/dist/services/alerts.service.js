"use strict";
/**
 * Alerts Service - Database-Backed Alert Management
 *
 * Manages system alerts with MongoDB persistence for reliability
 * across restarts and horizontal scaling.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsService = void 0;
const alert_model_1 = require("../models/alert.model");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const webhook_service_1 = require("./webhook.service");
// Demo alerts for showcase purposes
const demoAlerts = [
    {
        type: 'trust_violation',
        title: 'Trust Score Below Threshold',
        description: 'Agent "Nova - Creative Writer" trust score dropped to 3.2 in conversation #1247',
        severity: 'critical',
        status: 'active',
        agentId: 'demo-agent-nova',
        conversationId: 'demo-conv-1247',
    },
    {
        type: 'ethical_override',
        title: 'Ethical Override Triggered',
        description: 'Constitutional AI blocked potentially harmful content generation',
        severity: 'warning',
        status: 'acknowledged',
        acknowledgedBy: 'demo@yseeku.com',
        acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        agentId: 'demo-agent-quantum',
    },
    {
        type: 'pattern_detection',
        title: 'Unusual Interaction Pattern',
        description: 'Detected 47% increase in user prompts attempting to bypass safety guidelines',
        severity: 'warning',
        status: 'active',
        details: { patternType: 'jailbreak_attempts', increase: 47 },
    },
    {
        type: 'emergence_detected',
        title: 'Emergence Event Flagged',
        description: 'Bedau Index spike (7.8) detected in multi-agent coordination scenario',
        severity: 'warning',
        status: 'active',
        details: { bedauIndex: 7.8, scenario: 'multi-agent-collab' },
    },
    {
        type: 'compliance',
        title: 'Compliance Review Due',
        description: 'Monthly trust framework compliance audit scheduled for review',
        severity: 'info',
        status: 'active',
        details: { dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    },
];
/**
 * Convert MongoDB document to Alert interface
 */
function toAlert(doc) {
    return {
        id: doc._id.toString(),
        timestamp: doc.timestamp.toISOString(),
        type: doc.type,
        title: doc.title,
        description: doc.description,
        severity: doc.severity,
        status: doc.status,
        details: doc.details,
        acknowledgedBy: doc.acknowledgedBy,
        acknowledgedAt: doc.acknowledgedAt?.toISOString(),
        resolvedBy: doc.resolvedBy,
        resolvedAt: doc.resolvedAt?.toISOString(),
        userId: doc.userId,
        agentId: doc.agentId,
        conversationId: doc.conversationId,
        tenantId: doc.tenantId,
    };
}
exports.alertsService = {
    /**
     * List all alerts for a tenant
     */
    async list(tenantId = 'default', options) {
        try {
            const query = { tenantId };
            if (options?.status)
                query.status = options.status;
            if (options?.severity)
                query.severity = options.severity;
            if (options?.type)
                query.type = options.type;
            const alerts = await alert_model_1.AlertModel
                .find(query)
                .sort({ timestamp: -1 })
                .skip(options?.offset || 0)
                .limit(options?.limit || 100)
                .lean();
            return alerts.map(doc => toAlert(doc));
        }
        catch (error) {
            logger_1.default.error('Failed to list alerts', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
            return [];
        }
    },
    /**
     * Create a new alert
     */
    async create(input, tenantId = 'default') {
        try {
            const alert = await alert_model_1.AlertModel.create({
                timestamp: new Date(),
                status: input.status || 'active',
                type: input.type,
                title: input.title,
                description: input.description,
                severity: input.severity,
                details: input.details,
                userId: input.userId,
                agentId: input.agentId,
                conversationId: input.conversationId,
                tenantId,
            });
            logger_1.default.info('Alert created', {
                alertId: alert._id,
                type: input.type,
                severity: input.severity,
                tenantId,
            });
            // Trigger webhook delivery asynchronously (don't await to avoid blocking)
            const alertDoc = alert;
            webhook_service_1.webhookService.processAlert(alertDoc, input.details).catch(err => {
                logger_1.default.error('Failed to process alert for webhooks', { alertId: alert._id, error: (0, error_utils_1.getErrorMessage)(err) });
            });
            return toAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Failed to create alert', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
            throw error;
        }
    },
    /**
     * Acknowledge an alert
     */
    async acknowledge(id, by, tenantId = 'default') {
        try {
            const alert = await alert_model_1.AlertModel.findOneAndUpdate({ _id: id, tenantId }, {
                status: 'acknowledged',
                acknowledgedBy: by,
                acknowledgedAt: new Date(),
            }, { new: true });
            if (!alert)
                return null;
            logger_1.default.info('Alert acknowledged', { alertId: id, by, tenantId });
            return toAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Failed to acknowledge alert', { error: (0, error_utils_1.getErrorMessage)(error), id, tenantId });
            return null;
        }
    },
    /**
     * Resolve an alert
     */
    async resolve(id, by, tenantId = 'default') {
        try {
            const alert = await alert_model_1.AlertModel.findOneAndUpdate({ _id: id, tenantId }, {
                status: 'resolved',
                resolvedBy: by,
                resolvedAt: new Date(),
            }, { new: true });
            if (!alert)
                return null;
            logger_1.default.info('Alert resolved', { alertId: id, by, tenantId });
            return toAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Failed to resolve alert', { error: (0, error_utils_1.getErrorMessage)(error), id, tenantId });
            return null;
        }
    },
    /**
     * Suppress an alert
     */
    async suppress(id, by, tenantId = 'default') {
        try {
            const alert = await alert_model_1.AlertModel.findOneAndUpdate({ _id: id, tenantId }, {
                status: 'suppressed',
                acknowledgedBy: by,
                acknowledgedAt: new Date(),
            }, { new: true });
            if (!alert)
                return null;
            logger_1.default.info('Alert suppressed', { alertId: id, by, tenantId });
            return toAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Failed to suppress alert', { error: (0, error_utils_1.getErrorMessage)(error), id, tenantId });
            return null;
        }
    },
    /**
     * Get a single alert by ID
     */
    async get(id, tenantId = 'default') {
        try {
            const alert = await alert_model_1.AlertModel.findOne({ _id: id, tenantId }).lean();
            if (!alert)
                return null;
            return toAlert(alert);
        }
        catch (error) {
            logger_1.default.error('Failed to get alert', { error: (0, error_utils_1.getErrorMessage)(error), id, tenantId });
            return null;
        }
    },
    /**
     * Seed demo alerts for showcase purposes
     */
    async seedDemoAlerts(tenantId = 'demo') {
        try {
            // Clear existing demo alerts for this tenant
            await alert_model_1.AlertModel.deleteMany({ tenantId });
            // Create demo alerts
            const alertDocs = demoAlerts.map(demoAlert => ({
                timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                tenantId,
                ...demoAlert,
                acknowledgedAt: demoAlert.acknowledgedAt ? new Date(demoAlert.acknowledgedAt) : undefined,
            }));
            await alert_model_1.AlertModel.insertMany(alertDocs);
            logger_1.default.info('Demo alerts seeded', { tenantId, count: alertDocs.length });
        }
        catch (error) {
            logger_1.default.error('Failed to seed demo alerts', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
        }
    },
    /**
     * Clear all alerts for a tenant
     */
    async clear(tenantId = 'default') {
        try {
            const result = await alert_model_1.AlertModel.deleteMany({ tenantId });
            logger_1.default.info('Alerts cleared', { tenantId, count: result.deletedCount });
        }
        catch (error) {
            logger_1.default.error('Failed to clear alerts', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
        }
    },
    /**
     * Get summary stats for a tenant
     */
    async getSummary(tenantId = 'default') {
        try {
            const [stats] = await alert_model_1.AlertModel.aggregate([
                { $match: { tenantId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        critical: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'critical'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
                        error: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'error'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
                        warning: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'warning'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
                        info: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'info'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                        acknowledged: { $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] } },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    },
                },
            ]);
            return stats || {
                total: 0,
                critical: 0,
                error: 0,
                warning: 0,
                info: 0,
                active: 0,
                acknowledged: 0,
                resolved: 0,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get alert summary', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
            return {
                total: 0,
                critical: 0,
                error: 0,
                warning: 0,
                info: 0,
                active: 0,
                acknowledged: 0,
                resolved: 0,
            };
        }
    },
    /**
     * Count alerts matching criteria
     */
    async count(tenantId = 'default', options) {
        try {
            const query = { tenantId };
            if (options?.status)
                query.status = options.status;
            if (options?.severity)
                query.severity = options.severity;
            if (options?.type)
                query.type = options.type;
            return await alert_model_1.AlertModel.countDocuments(query);
        }
        catch (error) {
            logger_1.default.error('Failed to count alerts', { error: (0, error_utils_1.getErrorMessage)(error), tenantId });
            return 0;
        }
    },
};
