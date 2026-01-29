"use strict";
/**
 * Consent Configuration Routes
 *
 * API endpoints for managing enterprise consent configuration.
 * Allows tenants to customize their consent model, escalation channels,
 * and withdrawal behavior while staying compliant.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_utils_1 = require("../utils/error-utils");
const logger_1 = __importDefault(require("../utils/logger"));
const core_1 = require("@sonate/core");
const router = (0, express_1.Router)();
// In-memory store for tenant configs (in production, use database)
const tenantConfigs = new Map();
/**
 * @route   GET /api/consent/config
 * @desc    Get consent configuration for current tenant
 * @access  Private
 */
router.get('/config', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        // Get tenant-specific config or default
        const config = tenantConfigs.get(tenantId) || core_1.DEFAULT_EU_CONFIG;
        res.json({
            success: true,
            data: {
                config,
                tenantId,
                isDefault: !tenantConfigs.has(tenantId),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get consent config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consent configuration',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/consent/config/presets
 * @desc    Get available consent configuration presets
 * @access  Private
 */
router.get('/config/presets', auth_middleware_1.protect, async (req, res) => {
    try {
        const presets = [
            {
                id: 'default',
                name: 'EU Standard (GDPR/AI Act)',
                description: 'Full GDPR and AI Act compliance with layered consent and human oversight',
                config: core_1.DEFAULT_EU_CONFIG,
                recommended: true,
            },
            {
                id: 'streamlined',
                name: 'EU Streamlined',
                description: 'GDPR compliant with streamlined UX - minimal friction consent flow',
                config: core_1.STREAMLINED_CONFIG,
                recommended: false,
            },
            {
                id: 'strict',
                name: 'High Compliance (Healthcare/Finance)',
                description: 'Strict binary consent with manual review for data requests',
                config: core_1.STRICT_CONFIG,
                recommended: false,
            },
            {
                id: 'us',
                name: 'US Standard (CCPA)',
                description: 'CCPA compliant with opt-out model - not GDPR compliant',
                config: core_1.US_CONFIG,
                recommended: false,
            },
        ];
        res.json({
            success: true,
            data: { presets },
        });
    }
    catch (error) {
        logger_1.default.error('Get consent presets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch consent presets',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   PUT /api/consent/config
 * @desc    Update consent configuration for current tenant
 * @access  Private (Admin only in production)
 */
router.put('/config', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const { config, preset } = req.body;
        let newConfig;
        if (preset) {
            // Use a preset
            newConfig = (0, core_1.getConsentConfig)(preset);
        }
        else if (config) {
            // Merge custom config with defaults
            const baseConfig = tenantConfigs.get(tenantId) || core_1.DEFAULT_EU_CONFIG;
            newConfig = (0, core_1.mergeWithDefaults)(config, baseConfig);
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Either config or preset must be provided',
            });
            return;
        }
        // Validate configuration
        const validation = (0, core_1.validateConsentConfig)(newConfig);
        if (!validation.valid) {
            res.status(400).json({
                success: false,
                message: 'Configuration validation failed',
                errors: validation.errors,
                warnings: validation.warnings,
            });
            return;
        }
        // Store configuration
        tenantConfigs.set(tenantId, newConfig);
        logger_1.default.info('Consent config updated', { tenantId, preset: preset || 'custom' });
        res.json({
            success: true,
            message: 'Consent configuration updated successfully',
            data: {
                config: newConfig,
                warnings: validation.warnings,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Update consent config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update consent configuration',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/consent/config/validate
 * @desc    Validate a consent configuration without saving
 * @access  Private
 */
router.post('/config/validate', auth_middleware_1.protect, async (req, res) => {
    try {
        const { config } = req.body;
        if (!config) {
            res.status(400).json({
                success: false,
                message: 'Configuration is required',
            });
            return;
        }
        // Merge with defaults to get complete config
        const fullConfig = (0, core_1.mergeWithDefaults)(config, core_1.DEFAULT_EU_CONFIG);
        // Validate
        const validation = (0, core_1.validateConsentConfig)(fullConfig);
        res.json({
            success: true,
            data: {
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings,
                resultingConfig: fullConfig,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Validate consent config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate consent configuration',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/consent/escalation-channels
 * @desc    Get available escalation channels for current tenant
 * @access  Private
 */
router.get('/escalation-channels', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const config = tenantConfigs.get(tenantId) || core_1.DEFAULT_EU_CONFIG;
        // Get enabled channels sorted by priority
        const channels = config.escalationChannels
            .filter(c => c.enabled)
            .sort((a, b) => a.priority - b.priority);
        res.json({
            success: true,
            data: { channels },
        });
    }
    catch (error) {
        logger_1.default.error('Get escalation channels error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch escalation channels',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/consent/escalate
 * @desc    Initiate escalation to human
 * @access  Private
 */
router.post('/escalate', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const { channelType, conversationId, context } = req.body;
        const config = tenantConfigs.get(tenantId) || core_1.DEFAULT_EU_CONFIG;
        // Find the requested channel
        const channel = config.escalationChannels.find(c => c.type === channelType && c.enabled);
        if (!channel) {
            res.status(400).json({
                success: false,
                message: `Escalation channel ${channelType} is not available`,
            });
            return;
        }
        // In production, this would:
        // 1. Create a ticket in the support system
        // 2. Transfer to live agent queue
        // 3. Send email notification
        // 4. etc.
        logger_1.default.info('Escalation initiated', {
            tenantId,
            channel: channelType,
            conversationId,
            userId: req.userId,
        });
        // Return escalation confirmation
        res.json({
            success: true,
            message: 'Escalation initiated successfully',
            data: {
                escalationId: `esc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                channel: {
                    type: channel.type,
                    label: channel.label,
                    expectedResponseTime: channel.expectedResponseTime,
                },
                contextPreserved: config.withdrawalBehavior.humanEscalation.preserveContext,
                nextSteps: getNextSteps(channel),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Escalation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate escalation',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/consent/data-request
 * @desc    Submit a data request (export, deletion, etc.)
 * @access  Private
 */
router.post('/data-request', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        const { requestType, details } = req.body;
        const config = tenantConfigs.get(tenantId) || core_1.DEFAULT_EU_CONFIG;
        // Validate request type
        if (!['export', 'deletion', 'restriction', 'portability'].includes(requestType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid request type',
            });
            return;
        }
        const requestConfig = config.dataRequests[requestType];
        if (!requestConfig.enabled) {
            res.status(400).json({
                success: false,
                message: `${requestType} requests are not enabled for this tenant`,
            });
            return;
        }
        // Create data request
        const requestId = `dr-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        logger_1.default.info('Data request created', {
            requestId,
            tenantId,
            requestType,
            userId: req.userId,
            mode: requestConfig.mode,
        });
        res.json({
            success: true,
            message: 'Data request submitted successfully',
            data: {
                requestId,
                requestType,
                status: requestConfig.mode === 'IMMEDIATE' ? 'PROCESSING' : 'PENDING_REVIEW',
                estimatedCompletion: getEstimatedCompletion(requestType, config),
                verificationRequired: requestConfig.verificationRequired || false,
                nextSteps: getDataRequestNextSteps(requestType, requestConfig),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Data request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit data request',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   DELETE /api/consent/config
 * @desc    Reset consent configuration to default for current tenant
 * @access  Private (Admin only in production)
 */
router.delete('/config', auth_middleware_1.protect, async (req, res) => {
    try {
        const tenantId = req.userTenant || 'default';
        tenantConfigs.delete(tenantId);
        logger_1.default.info('Consent config reset to default', { tenantId });
        res.json({
            success: true,
            message: 'Consent configuration reset to EU default',
            data: {
                config: core_1.DEFAULT_EU_CONFIG,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Reset consent config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset consent configuration',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
// Helper functions
function getNextSteps(channel) {
    switch (channel.type) {
        case 'LIVE_HANDOFF':
            return [
                'You will be connected to a human agent shortly',
                `Expected wait time: ${channel.expectedResponseTime}`,
                'Your conversation context will be shared with the agent',
            ];
        case 'CALLBACK_REQUEST':
            return [
                'A team member will call you back',
                `Expected callback within: ${channel.expectedResponseTime}`,
                'Please ensure your contact number is up to date',
            ];
        case 'EMAIL_SUPPORT':
            return [
                `Your request has been sent to ${channel.email}`,
                `Expected response within: ${channel.expectedResponseTime}`,
                'Check your inbox for updates',
            ];
        default:
            return ['Your request has been submitted'];
    }
}
function getEstimatedCompletion(requestType, config) {
    switch (requestType) {
        case 'export':
            return config.dataRequests.export.maxWaitTime;
        case 'deletion':
            return `${config.dataRequests.deletion.gracePeriod} (after grace period)`;
        default:
            return '30 days';
    }
}
function getDataRequestNextSteps(requestType, requestConfig) {
    const steps = [];
    if (requestConfig.verificationRequired) {
        steps.push('Identity verification will be required before processing');
    }
    if (requestConfig.mode === 'MANUAL_REVIEW') {
        steps.push('Your request will be reviewed by a team member');
    }
    if (requestType === 'deletion' && requestConfig.gracePeriod) {
        steps.push(`A ${requestConfig.gracePeriod} grace period applies before permanent deletion`);
    }
    if (requestConfig.notifyOnCompletion) {
        steps.push('You will be notified when your request is complete');
    }
    return steps;
}
exports.default = router;
