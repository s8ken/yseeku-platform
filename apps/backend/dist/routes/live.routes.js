"use strict";
/**
 * Live Dashboard Routes
 * Real-time metrics and historical data for live monitoring
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const live_metrics_service_1 = require("../services/live-metrics.service");
const alerts_service_1 = require("../services/alerts.service");
const conversation_model_1 = require("../models/conversation.model");
const agent_model_1 = require("../models/agent.model");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /api/live/metrics
 * Get current live metrics snapshot
 */
router.get('/metrics', auth_middleware_1.protect, async (req, res) => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 3600000);
        const oneDayAgo = new Date(now.getTime() - 24 * 3600000);
        // Fetch real-time data
        const [activeAgents, totalAgents, recentConversations, activeAlerts,] = await Promise.all([
            agent_model_1.Agent.countDocuments({ lastActive: { $gte: oneHourAgo } }),
            agent_model_1.Agent.countDocuments(),
            conversation_model_1.Conversation.find({ lastActivity: { $gte: oneDayAgo } })
                .select('messages lastActivity')
                .limit(100)
                .lean(),
            alerts_service_1.alertsService.list('default', { status: 'active', limit: 100 }),
        ]);
        // Calculate trust metrics from recent conversations
        let totalTrust = 0;
        let messageCount = 0;
        for (const conv of recentConversations) {
            for (const msg of conv.messages) {
                totalTrust += (msg.trustScore || 5) * 2; // Convert 0-5 to 0-10
                messageCount++;
            }
        }
        const avgTrust = messageCount > 0 ? totalTrust / messageCount : 8.5;
        // Calculate alert summary
        const alertSummary = {
            total: activeAlerts.length,
            critical: activeAlerts.filter(a => a.severity === 'critical').length,
            warning: activeAlerts.filter(a => a.severity === 'warning').length,
            info: activeAlerts.filter(a => a.severity === 'info').length,
        };
        res.json({
            success: true,
            data: {
                timestamp: now.toISOString(),
                trust: {
                    current: Math.round(avgTrust * 10) / 10,
                    status: avgTrust >= 8 ? 'healthy' : avgTrust >= 6 ? 'warning' : 'critical',
                },
                system: {
                    activeAgents,
                    totalAgents,
                    conversationsToday: recentConversations.length,
                    messagesProcessed: messageCount,
                },
                alerts: alertSummary,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get live metrics', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to get metrics' });
    }
});
/**
 * GET /api/live/history
 * Get historical metrics for charts
 */
router.get('/history', auth_middleware_1.protect, async (req, res) => {
    try {
        const hours = Math.min(parseInt(req.query.hours) || 24, 168); // Max 7 days
        const resolution = req.query.resolution === 'minute' ? 'minute' : 'hour';
        const history = await (0, live_metrics_service_1.getHistoricalMetrics)(hours, resolution);
        res.json({
            success: true,
            data: {
                timeRange: `${hours}h`,
                resolution,
                points: history,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get historical metrics', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to get history' });
    }
});
/**
 * GET /api/live/events
 * Get recent trust events
 */
router.get('/events', auth_middleware_1.protect, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const oneDayAgo = new Date(Date.now() - 24 * 3600000);
        // Get recent alerts as events
        const alerts = await alerts_service_1.alertsService.list('default', { limit });
        // Get recent conversation activity
        const conversations = await conversation_model_1.Conversation.find({
            lastActivity: { $gte: oneDayAgo },
        })
            .select('messages agents lastActivity')
            .populate('agents', 'name')
            .sort({ lastActivity: -1 })
            .limit(limit)
            .lean();
        // Build event list
        const events = [];
        // Add alerts as events
        for (const alert of alerts) {
            events.push({
                id: alert.id,
                timestamp: alert.timestamp,
                type: 'alert',
                description: alert.title,
                severity: alert.severity,
            });
        }
        // Add recent messages as events
        for (const conv of conversations) {
            const recentMsgs = conv.messages.slice(-3);
            for (const msg of recentMsgs) {
                if (msg.sender === 'ai') {
                    events.push({
                        id: `msg-${msg.metadata?.messageId || Date.now()}`,
                        timestamp: msg.timestamp.toISOString(),
                        type: 'message',
                        description: `Agent response evaluated`,
                        severity: (msg.trustScore || 5) >= 4 ? 'info' : 'warning',
                        agentName: conv.agents[0]?.name || 'Unknown Agent',
                        trustScore: (msg.trustScore || 5) * 2,
                    });
                }
            }
        }
        // Sort by timestamp
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        res.json({
            success: true,
            data: events.slice(0, limit),
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get events', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to get events' });
    }
});
/**
 * GET /api/live/agents
 * Get real-time agent status
 */
router.get('/agents', auth_middleware_1.protect, async (req, res) => {
    try {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const agents = await agent_model_1.Agent.find()
            .select('name status model systemPrompt lastActive metadata')
            .sort({ lastActive: -1 })
            .limit(20)
            .lean();
        const agentStatus = agents.map(agent => ({
            id: agent._id.toString(),
            name: agent.name,
            status: agent.lastActive && agent.lastActive >= oneHourAgo ? 'active' : 'idle',
            model: agent.model,
            lastActive: agent.lastActive?.toISOString(),
            trustScore: agent.metadata?.trustScore || 8.5,
        }));
        res.json({
            success: true,
            data: agentStatus,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get agent status', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to get agents' });
    }
});
/**
 * GET /api/live/health
 * System health check with metrics
 */
router.get('/health', async (req, res) => {
    try {
        const startTime = Date.now();
        // Check database connectivity
        const dbStart = Date.now();
        await agent_model_1.Agent.findOne().select('_id').lean();
        const dbLatency = Date.now() - dbStart;
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(uptime),
                database: {
                    status: 'connected',
                    latency: dbLatency,
                },
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                },
                responseTime: Date.now() - startTime,
            },
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: (0, error_utils_1.getErrorMessage)(error),
            },
        });
    }
});
exports.default = router;
