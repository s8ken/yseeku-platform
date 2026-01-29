"use strict";
/**
 * Audit Trail Routes
 * Provides audit log retrieval with advanced filtering and search
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const audit_model_1 = require("../models/audit.model");
const tenant_context_middleware_1 = require("../middleware/tenant-context.middleware");
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /api/audit/logs
 * Get audit logs with advanced filtering and pagination
 *
 * Query params:
 * - tenant: string (defaults to user's tenant)
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - severity: 'info' | 'warning' | 'error' | 'critical'
 * - resourceType: string (e.g., 'agent', 'conversation', 'tenant', 'user')
 * - userId: string (filter by specific user)
 * - action: string (filter by specific action)
 * - outcome: 'success' | 'failure' | 'partial'
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - search: string (search in action, resourceType, resourceId)
 */
router.get('/logs', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, async (req, res) => {
    try {
        const userId = req.userId;
        const userTenant = req.userTenant || 'default';
        // Parse query parameters
        const { tenant = userTenant, page = '1', limit = '50', severity, resourceType, userId: filterUserId, action, outcome, startDate, endDate, search, } = req.query;
        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {
            tenantId: tenant,
        };
        // Severity filter
        if (severity && ['info', 'warning', 'error', 'critical'].includes(severity)) {
            filter.severity = severity;
        }
        // Resource type filter
        if (resourceType) {
            filter.resourceType = resourceType;
        }
        // User ID filter
        if (filterUserId) {
            filter.userId = filterUserId;
        }
        // Action filter
        if (action) {
            filter.action = action;
        }
        // Outcome filter
        if (outcome && ['success', 'failure', 'partial'].includes(outcome)) {
            filter.outcome = outcome;
        }
        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.timestamp.$lte = new Date(endDate);
            }
        }
        // Search filter (searches across action, resourceType, resourceId)
        if (search && search.trim()) {
            const searchTerm = search.trim();
            filter.$or = [
                { action: { $regex: searchTerm, $options: 'i' } },
                { resourceType: { $regex: searchTerm, $options: 'i' } },
                { resourceId: { $regex: searchTerm, $options: 'i' } },
                { userEmail: { $regex: searchTerm, $options: 'i' } },
            ];
        }
        // Execute queries in parallel
        const [logs, total] = await Promise.all([
            audit_model_1.AuditLog.find(filter)
                .select('timestamp userId userEmail action resourceType resourceId severity outcome details ipAddress sessionId')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            audit_model_1.AuditLog.countDocuments(filter),
        ]);
        // Transform logs for frontend
        const transformedLogs = logs.map(log => ({
            id: log._id.toString(),
            timestamp: log.timestamp.toISOString(),
            userId: log.userId,
            userEmail: log.userEmail || log.userId,
            action: log.action,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            severity: log.severity,
            outcome: log.outcome,
            details: log.details || {},
            ipAddress: log.ipAddress,
            sessionId: log.sessionId,
        }));
        logger_1.default.info('Audit logs retrieved', {
            userId,
            tenant,
            page: pageNum,
            limit: limitNum,
            total,
            filters: {
                severity,
                resourceType,
                filterUserId,
                action,
                outcome,
                hasSearch: !!search,
            },
        });
        res.json({
            success: true,
            data: {
                logs: transformedLogs,
                total,
                page: pageNum,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to query audit logs', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/audit/trails
 * Get audit trails (alias for /logs with more detailed response)
 *
 * Same query params as /logs
 */
router.get('/trails', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, async (req, res) => {
    try {
        const userId = req.userId;
        const userTenant = req.userTenant || 'default';
        // Parse query parameters
        const { tenant = userTenant, page = '1', limit = '50', severity, resourceType, userId: filterUserId, action, outcome, startDate, endDate, search, } = req.query;
        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {
            tenantId: tenant,
        };
        // Apply filters (same as /logs)
        if (severity && ['info', 'warning', 'error', 'critical'].includes(severity)) {
            filter.severity = severity;
        }
        if (resourceType) {
            filter.resourceType = resourceType;
        }
        if (filterUserId) {
            filter.userId = filterUserId;
        }
        if (action) {
            filter.action = action;
        }
        if (outcome && ['success', 'failure', 'partial'].includes(outcome)) {
            filter.outcome = outcome;
        }
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate)
                filter.timestamp.$gte = new Date(startDate);
            if (endDate)
                filter.timestamp.$lte = new Date(endDate);
        }
        if (search && search.trim()) {
            const searchTerm = search.trim();
            filter.$or = [
                { action: { $regex: searchTerm, $options: 'i' } },
                { resourceType: { $regex: searchTerm, $options: 'i' } },
                { resourceId: { $regex: searchTerm, $options: 'i' } },
                { userEmail: { $regex: searchTerm, $options: 'i' } },
            ];
        }
        // Execute queries
        const [trails, total] = await Promise.all([
            audit_model_1.AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            audit_model_1.AuditLog.countDocuments(filter),
        ]);
        // Get summary statistics
        const [actionCounts, statusCounts] = await Promise.all([
            audit_model_1.AuditLog.aggregate([
                { $match: filter },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $limit: 20 },
            ]),
            audit_model_1.AuditLog.aggregate([
                { $match: filter },
                { $group: { _id: '$outcome', count: { $sum: 1 } } },
            ]),
        ]);
        // Transform for summary
        const byAction = {};
        actionCounts.forEach((item) => {
            byAction[item._id] = item.count;
        });
        const byStatus = {};
        statusCounts.forEach((item) => {
            byStatus[item._id] = item.count;
        });
        // Transform trails for frontend
        const transformedTrails = trails.map(trail => ({
            id: trail._id.toString(),
            timestamp: trail.timestamp.toISOString(),
            action: trail.action,
            resource: trail.resourceType,
            resourceId: trail.resourceId,
            actor: trail.userEmail || trail.userId,
            actorType: 'user',
            status: trail.outcome,
            details: trail.details || {},
            tenantId: trail.tenantId,
        }));
        logger_1.default.info('Audit trails retrieved', {
            userId,
            tenant,
            total,
            page: pageNum,
        });
        res.json({
            success: true,
            data: {
                trails: transformedTrails,
                summary: {
                    total,
                    byAction,
                    byStatus,
                },
                pagination: {
                    total,
                    offset: skip,
                    limit: limitNum,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to export audit logs', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit trails',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/audit/summary
 * Get audit summary statistics for the current tenant
 */
router.get('/summary', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const { tenant = userTenant, days = '7' } = req.query;
        const daysNum = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);
        const filter = {
            tenantId: tenant,
            timestamp: { $gte: startDate },
        };
        // Aggregate statistics
        const [severityCounts, actionCounts, totalCount] = await Promise.all([
            audit_model_1.AuditLog.aggregate([
                { $match: filter },
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            audit_model_1.AuditLog.aggregate([
                { $match: filter },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            audit_model_1.AuditLog.countDocuments(filter),
        ]);
        const bySeverity = {
            info: 0,
            warning: 0,
            error: 0,
            critical: 0,
        };
        severityCounts.forEach((item) => {
            bySeverity[item._id] = item.count;
        });
        const topActions = actionCounts.map((item) => ({
            action: item._id,
            count: item.count,
        }));
        res.json({
            success: true,
            data: {
                total: totalCount,
                timeRange: {
                    days: daysNum,
                    start: startDate.toISOString(),
                    end: new Date().toISOString(),
                },
                bySeverity,
                topActions,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get audit statistics', {
            error,
            stack: (0, error_utils_1.getErrorStack)(error),
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit summary',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
