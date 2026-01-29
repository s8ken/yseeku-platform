"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const tenant_context_middleware_1 = require("../middleware/tenant-context.middleware");
const override_service_1 = require("../services/override.service");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /api/overrides/queue
 * Get override queue with filtering and pagination
 */
router.get('/queue', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:read']), async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const { status, type, startDate, endDate, search, limit = '50', offset = '0' } = req.query;
        const filters = {
            status: status ? status.split(',') : undefined,
            type: type ? type.split(',') : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            search: search
        };
        const options = {
            limit: Math.min(100, Math.max(1, parseInt(limit))),
            offset: Math.max(0, parseInt(offset))
        };
        const result = await override_service_1.overrideService.getOverrideQueue(tenantId, filters, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Get override queue error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch override queue',
            error: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /api/overrides/history
 * Get override history with filtering and pagination
 */
router.get('/history', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:read']), async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const { decision, userId, startDate, endDate, emergency, limit = '50', offset = '0' } = req.query;
        const filters = {
            decision: decision ? decision.split(',') : undefined,
            userId: userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            emergency: emergency ? emergency === 'true' : undefined
        };
        const options = {
            limit: Math.min(100, Math.max(1, parseInt(limit))),
            offset: Math.max(0, parseInt(offset))
        };
        const result = await override_service_1.overrideService.getOverrideHistory(tenantId, filters, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Get override history error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch override history',
            error: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * POST /api/overrides/decide
 * Process override decision (approve/reject)
 */
router.post('/decide', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:act']), async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const userId = req.userId || 'system';
        const userEmail = req.userEmail || 'system';
        const { actionId, decision, reason, emergency = false } = req.body;
        if (!actionId || !decision || !reason) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: actionId, decision, reason'
            });
            return;
        }
        if (!['approve', 'reject'].includes(decision)) {
            res.status(400).json({
                success: false,
                message: 'Invalid decision. Must be "approve" or "reject"'
            });
            return;
        }
        if (reason.trim().length < 3) {
            res.status(400).json({
                success: false,
                message: 'Reason must be at least 3 characters long'
            });
            return;
        }
        const result = await override_service_1.overrideService.processOverride({
            actionId,
            decision: decision,
            reason: reason.trim().slice(0, 1000), // Limit to 1000 characters
            emergency: Boolean(emergency),
            userId,
            tenantId
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Process override decision error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to process override decision',
            error: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /api/overrides/stats
 * Get override statistics
 */
router.get('/stats', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:read']), async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const stats = await override_service_1.overrideService.getOverrideStats(tenantId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('Get override stats error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch override statistics',
            error: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * POST /api/overrides/bulk
 * Process bulk override decisions
 */
router.post('/bulk', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:act']), async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const userId = req.userId || 'system';
        const { actionIds, decision, reason } = req.body;
        if (!Array.isArray(actionIds) || actionIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'actionIds must be a non-empty array'
            });
            return;
        }
        if (!decision || !['approve', 'reject'].includes(decision)) {
            res.status(400).json({
                success: false,
                message: 'Invalid decision. Must be "approve" or "reject"'
            });
            return;
        }
        if (!reason || reason.trim().length < 3) {
            res.status(400).json({
                success: false,
                message: 'Reason must be at least 3 characters long'
            });
            return;
        }
        const results = [];
        const errors = [];
        for (const actionId of actionIds) {
            try {
                const result = await override_service_1.overrideService.processOverride({
                    actionId,
                    decision: decision,
                    reason: reason.trim().slice(0, 1000),
                    emergency: false,
                    userId,
                    tenantId
                });
                results.push({ actionId, ...result, processed: true });
            }
            catch (error) {
                errors.push({ actionId, error: (0, error_utils_1.getErrorMessage)(error) });
            }
        }
        res.json({
            success: true,
            data: {
                processed: results.length,
                failed: errors.length,
                results,
                errors
            }
        });
    }
    catch (error) {
        logger_1.default.error('Bulk override error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk overrides',
            error: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
exports.default = router;
