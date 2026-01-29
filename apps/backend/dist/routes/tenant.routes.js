"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_model_1 = require("../models/tenant.model");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /api/tenants
 * List all tenants (paginated)
 */
router.get('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [tenants, total] = await Promise.all([
            tenant_model_1.Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            tenant_model_1.Tenant.countDocuments(),
        ]);
        res.json({
            success: true,
            data: tenants,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
            source: 'database',
        });
    }
    catch (error) {
        logger_1.default.error('Get tenants error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tenants',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/tenants/:id
 * Get a single tenant by ID
 */
router.get('/:id', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenant = await tenant_model_1.Tenant.findById(req.params.id);
        if (!tenant) {
            res.status(404).json({
                success: false,
                message: 'Tenant not found',
            });
            return;
        }
        res.json({
            success: true,
            data: tenant,
        });
    }
    catch (error) {
        logger_1.default.error('Get tenant error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tenant',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * POST /api/tenants
 * Create a new tenant
 */
router.post('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Tenant name is required',
            });
            return;
        }
        const tenant = await tenant_model_1.Tenant.create({
            name,
            description,
            status: 'active',
            complianceStatus: 'compliant',
            trustScore: 85,
        });
        logger_1.default.info('Tenant created', { tenantId: tenant._id, userId: req.userId });
        res.status(201).json({
            success: true,
            data: tenant,
            source: 'database',
        });
    }
    catch (error) {
        logger_1.default.error('Create tenant error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to create tenant',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * PUT /api/tenants/:id
 * Update a tenant
 */
router.put('/:id', auth_middleware_1.protect, async (req, res) => {
    try {
        const { name, description, status, complianceStatus, trustScore } = req.body;
        const tenant = await tenant_model_1.Tenant.findById(req.params.id);
        if (!tenant) {
            res.status(404).json({
                success: false,
                message: 'Tenant not found',
            });
            return;
        }
        if (name)
            tenant.name = name;
        if (description !== undefined)
            tenant.description = description;
        if (status)
            tenant.status = status;
        if (complianceStatus)
            tenant.complianceStatus = complianceStatus;
        if (trustScore !== undefined)
            tenant.trustScore = trustScore;
        tenant.lastActivity = new Date();
        await tenant.save();
        res.json({
            success: true,
            data: tenant,
        });
    }
    catch (error) {
        logger_1.default.error('Update tenant error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to update tenant',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * DELETE /api/tenants/:id
 * Delete a tenant
 */
router.delete('/:id', auth_middleware_1.protect, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const tenant = await tenant_model_1.Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) {
            res.status(404).json({
                success: false,
                message: 'Tenant not found',
            });
            return;
        }
        logger_1.default.info('Tenant deleted', { tenantId: req.params.id, userId: req.userId });
        res.json({
            success: true,
            message: 'Tenant deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Delete tenant error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to delete tenant',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
