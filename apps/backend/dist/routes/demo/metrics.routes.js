"use strict";
/**
 * Demo Metrics Routes
 * Live metrics, live events, and alerts for demo dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alerts_service_1 = require("../../services/alerts.service");
const demo_seeder_service_1 = require("../../services/demo-seeder.service");
const agent_model_1 = require("../../models/agent.model");
const conversation_model_1 = require("../../models/conversation.model");
const trust_receipt_model_1 = require("../../models/trust-receipt.model");
const alert_model_1 = require("../../models/alert.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const error_utils_1 = require("../../utils/error-utils");
const middleware_1 = require("./middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/demo/alerts
 * @desc    Get demo alerts for showcase
 * @access  Public (for demo purposes)
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await alerts_service_1.alertsService.list(middleware_1.DEMO_TENANT_ID, { limit: 10 });
        const summary = await alerts_service_1.alertsService.getSummary(middleware_1.DEMO_TENANT_ID);
        res.json({
            tenant: middleware_1.DEMO_TENANT_ID,
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
    }
    catch (error) {
        logger_1.default.error('Demo alerts error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo alerts',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/live-metrics
 * @desc    Get live metrics for demo dashboard - consistent demo data
 * @access  Public (for demo purposes)
 */
router.get('/live-metrics', async (req, res) => {
    try {
        // Ensure demo is seeded
        await demo_seeder_service_1.demoSeederService.seed();
        // Query real data from demo tenant
        const [receipts, alerts, agents] = await Promise.all([
            trust_receipt_model_1.TrustReceiptModel.find({ tenant_id: middleware_1.DEMO_TENANT_ID })
                .sort({ timestamp: -1 })
                .limit(50)
                .lean(),
            alert_model_1.AlertModel.find({ tenantId: middleware_1.DEMO_TENANT_ID, status: 'active' }).lean(),
            agent_model_1.Agent.countDocuments({}),
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
            principleScores[key] = Math.round(principleScores[key] * 10) / 10;
        });
        const liveMetrics = {
            timestamp: new Date().toISOString(),
            trust: {
                current: Math.round(trustScore * 10) / 10,
                trend: 'up',
                delta: 0.3,
            },
            drift: {
                score: 0.12,
                status: 'normal',
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
    }
    catch (error) {
        logger_1.default.error('Demo live-metrics error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo live metrics',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/live-events
 * @desc    Get live events for demo dashboard - recent trust events and alerts
 * @access  Public (for demo purposes)
 */
router.get('/live-events', async (req, res) => {
    try {
        // Ensure demo is seeded
        await demo_seeder_service_1.demoSeederService.seed();
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        // Get alerts as events
        const alerts = await alert_model_1.AlertModel.find({ tenantId: middleware_1.DEMO_TENANT_ID })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        // Get recent conversations with trust scores
        const conversations = await conversation_model_1.Conversation.find({})
            .sort({ lastActivity: -1 })
            .limit(5)
            .populate('agents', 'name')
            .lean();
        // Build event list
        const events = [];
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
                    ? agentDoc.name
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
    }
    catch (error) {
        logger_1.default.error('Demo live-events error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo live events',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
