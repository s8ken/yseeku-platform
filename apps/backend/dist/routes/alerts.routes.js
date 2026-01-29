"use strict";
/**
 * Alerts Management Routes
 * Trust violation alerts and system alerts with database persistence
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const alerts_service_1 = require("../services/alerts.service");
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/dashboard/alerts/management
 * @desc    Get all alerts with filtering
 * @access  Private
 */
router.get('/management', auth_middleware_1.protect, async (req, res) => {
    try {
        const { status, severity, search, limit, offset } = req.query;
        const tenantId = String(req.tenant || 'default');
        // Get all alerts for filtering
        let alerts = await alerts_service_1.alertsService.list(tenantId, {
            status: status && status !== 'all' ? status : undefined,
            severity: severity && severity !== 'all' ? severity : undefined,
            limit: limit ? Number(limit) : 100,
            offset: offset ? Number(offset) : 0,
        });
        // Search filter (client-side for flexibility)
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            alerts = alerts.filter((alert) => alert.title.toLowerCase().includes(searchLower) ||
                alert.description.toLowerCase().includes(searchLower) ||
                alert.type.toLowerCase().includes(searchLower));
        }
        // Get summary stats
        const summary = await alerts_service_1.alertsService.getSummary(tenantId);
        res.json({
            success: true,
            data: {
                alerts: alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
                total: alerts.length,
                summary,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get alerts', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/dashboard/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.post('/:id/acknowledge', auth_middleware_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenant || 'default';
        const userEmail = req.userEmail || req.userId || 'unknown';
        const alert = await alerts_service_1.alertsService.acknowledge(String(id), String(userEmail), tenantId);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Alert acknowledged successfully',
            data: { alert },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to acknowledge alert', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge alert',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/dashboard/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Private
 */
router.post('/:id/resolve', auth_middleware_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = String(req.tenant || 'default');
        const userEmail = req.userEmail || req.userId || 'unknown';
        const alert = await alerts_service_1.alertsService.resolve(String(id), String(userEmail), tenantId);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Alert resolved successfully',
            data: { alert },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to resolve alert', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to resolve alert',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/dashboard/alerts/:id/suppress
 * @desc    Suppress an alert
 * @access  Private
 */
router.post('/:id/suppress', auth_middleware_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { duration } = req.body;
        const tenantId = String(req.tenant || 'default');
        const userEmail = req.userEmail || req.userId || 'unknown';
        if (!duration || typeof duration !== 'number') {
            res.status(400).json({
                success: false,
                message: 'Duration (in hours) is required',
            });
            return;
        }
        const alert = await alerts_service_1.alertsService.suppress(String(id), String(userEmail), tenantId);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
            return;
        }
        res.json({
            success: true,
            message: `Alert suppressed for ${duration} hour(s)`,
            data: { alert },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to suppress alert', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to suppress alert',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get alerts summary for dashboard
 * @access  Private
 */
router.get('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = String(req.tenant || 'default');
        // Get active alerts, sorted by timestamp, limited to 10
        const alerts = await alerts_service_1.alertsService.list(tenantId, {
            status: 'active',
            limit: 10,
        });
        // Get summary stats
        const summary = await alerts_service_1.alertsService.getSummary(tenantId);
        res.json({
            tenant: tenantId,
            summary: {
                critical: summary.critical,
                error: summary.error,
                warning: summary.warning,
                total: summary.active,
            },
            alerts: alerts.map((alert) => ({
                id: alert.id,
                timestamp: alert.timestamp,
                type: alert.type,
                title: alert.title,
                description: alert.description,
                severity: alert.severity,
                details: alert.details,
            })),
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get alerts summary', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts summary',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/dashboard/alerts
 * @desc    Create an alert
 * @access  Private
 */
router.post('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const { type, title, description, severity, details, agentId, conversationId } = req.body;
        const tenantId = String(req.tenant || 'default');
        if (!type || !title || !severity) {
            res.status(400).json({ success: false, message: 'type, title, severity required' });
            return;
        }
        const alert = await alerts_service_1.alertsService.create({
            type,
            title,
            description: description || '',
            severity,
            details,
            userId: req.userId,
            agentId,
            conversationId,
        }, tenantId);
        res.status(201).json({ success: true, data: alert });
    }
    catch (error) {
        logger_1.default.error('Failed to create alert', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({ success: false, message: 'Failed to create alert', error: (0, error_utils_1.getErrorMessage)(error) });
    }
});
/**
 * @route   GET /api/dashboard/alerts/:id
 * @desc    Get a single alert by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = String(req.tenant || 'default');
        const alert = await alerts_service_1.alertsService.get(String(id), tenantId);
        if (!alert) {
            res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
            return;
        }
        res.json({
            success: true,
            data: alert,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get alert by ID', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alert',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   DELETE /api/dashboard/alerts/clear
 * @desc    Clear all alerts for a tenant (admin only)
 * @access  Private
 */
router.delete('/clear', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = String(req.tenant || 'default');
        await alerts_service_1.alertsService.clear(tenantId);
        res.json({
            success: true,
            message: 'All alerts cleared',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to clear alerts', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
        });
        res.status(500).json({
            success: false,
            message: 'Failed to clear alerts',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
