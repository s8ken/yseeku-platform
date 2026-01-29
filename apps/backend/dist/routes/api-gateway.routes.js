"use strict";
/**
 * API Gateway Routes
 * Manage Platform API Keys and Rate Limits
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const platform_api_key_model_1 = require("../models/platform-api-key.model");
const audit_logger_1 = require("../utils/audit-logger");
const logger_1 = __importDefault(require("../utils/logger"));
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rate_limiters_1 = require("../middleware/rate-limiters");
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * Generate a secure random API key
 * Format: sk_[env]_[random_chars]
 */
const generateApiKey = (env = 'live') => {
    const buffer = crypto_1.default.randomBytes(24);
    return `sk_${env}_${buffer.toString('hex')}`;
};
/**
 * GET /api/gateway/keys
 * List all platform API keys for the current user/tenant
 */
router.get('/keys', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['gateway:manage']), rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        // Find keys for this user
        // In a real app, you might want admins to see all keys for the tenant
        const keys = await platform_api_key_model_1.PlatformApiKey.find({
            tenantId: userTenant
        }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: {
                keys: keys.map(k => ({
                    id: k._id,
                    name: k.name,
                    prefix: k.prefix,
                    status: k.status,
                    scopes: k.scopes,
                    lastUsed: k.lastUsed,
                    requests24h: k.requests24h,
                    createdAt: k.createdAt,
                    // key is NOT returned here for security
                })),
            },
        });
    }
    catch (error) {
        logger_1.default.error('List API keys error', { error: (0, error_utils_1.getErrorMessage)(error), userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to list API keys',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * POST /api/gateway/keys
 * Create a new platform API key
 */
router.post('/keys', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['gateway:manage']), rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { name, scopes, expiresIn } = req.body;
        const userTenant = req.userTenant || 'default';
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Key name is required',
            });
            return;
        }
        // Generate full key
        const rawKey = generateApiKey();
        const prefix = rawKey.substring(0, 12) + '...'; // e.g., sk_live_a1b2...
        // Hash key for storage
        const salt = await bcryptjs_1.default.genSalt(10);
        const keyHash = await bcryptjs_1.default.hash(rawKey, salt);
        // Calculate expiry if provided
        let expiresAt;
        if (expiresIn) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
        }
        const apiKey = await platform_api_key_model_1.PlatformApiKey.create({
            userId: req.userId,
            tenantId: userTenant,
            name,
            keyHash,
            prefix,
            scopes: scopes || ['read:all'],
            expiresAt,
        });
        // Log audit
        await (0, audit_logger_1.logSuccess)(req, 'api_key_create', 'platform-key', apiKey._id.toString(), {
            name,
            scopes: apiKey.scopes,
        });
        // Return the FULL key only once
        res.status(201).json({
            success: true,
            message: 'API Key created successfully',
            data: {
                key: {
                    id: apiKey._id,
                    name: apiKey.name,
                    prefix: apiKey.prefix,
                    status: apiKey.status,
                    scopes: apiKey.scopes,
                    createdAt: apiKey.createdAt,
                    // IMPORTANT: Return raw key so user can copy it
                    fullKey: rawKey,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Create API key error', { error: (0, error_utils_1.getErrorMessage)(error), userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to create API key',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * DELETE /api/gateway/keys/:id
 * Revoke (delete) an API key
 */
router.delete('/keys/:id', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['gateway:manage']), rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const userTenant = req.userTenant || 'default';
        const apiKey = await platform_api_key_model_1.PlatformApiKey.findOne({
            _id: id,
            tenantId: userTenant,
        });
        if (!apiKey) {
            res.status(404).json({
                success: false,
                message: 'API Key not found',
            });
            return;
        }
        // Instead of hard delete, we mark as revoked or delete?
        // Let's hard delete for MVP simplicity, or user choice
        await platform_api_key_model_1.PlatformApiKey.deleteOne({ _id: id });
        // Log audit
        await (0, audit_logger_1.logSuccess)(req, 'api_key_revoke', 'platform-key', String(id), {
            name: apiKey.name,
        });
        res.json({
            success: true,
            message: 'API Key revoked successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Revoke API key error', { error: (0, error_utils_1.getErrorMessage)(error), userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to revoke API key',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * PUT /api/gateway/keys/:id
 * Update API key (name, scopes, status)
 */
router.put('/keys/:id', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['gateway:manage']), rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, scopes } = req.body;
        const userTenant = req.userTenant || 'default';
        const apiKey = await platform_api_key_model_1.PlatformApiKey.findOne({
            _id: id,
            tenantId: userTenant,
        });
        if (!apiKey) {
            res.status(404).json({
                success: false,
                message: 'API Key not found',
            });
            return;
        }
        if (name)
            apiKey.name = name;
        if (status)
            apiKey.status = status;
        if (scopes)
            apiKey.scopes = scopes;
        await apiKey.save();
        res.json({
            success: true,
            message: 'API Key updated successfully',
            data: {
                key: {
                    id: apiKey._id,
                    name: apiKey.name,
                    status: apiKey.status,
                    scopes: apiKey.scopes,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Update API key error', { error: (0, error_utils_1.getErrorMessage)(error), userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to update API key',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
