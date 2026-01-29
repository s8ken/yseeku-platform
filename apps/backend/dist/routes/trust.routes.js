"use strict";
/**
 * Trust Protocol Routes
 * Exposes SONATE Trust Framework analytics and verification endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const trust_service_1 = require("../services/trust.service");
const trust_receipt_model_1 = require("../models/trust-receipt.model");
const conversation_model_1 = require("../models/conversation.model");
const core_1 = require("@sonate/core");
const did_service_1 = require("../services/did.service");
const rate_limiters_1 = require("../middleware/rate-limiters");
const error_utils_1 = require("../utils/error-utils");
const logger_1 = __importDefault(require("../utils/logger"));
function validateReceiptPayload(data) {
    if (!data || typeof data !== 'object')
        return 'Payload must be an object';
    if (!data.self_hash || typeof data.self_hash !== 'string' || data.self_hash.length < 16)
        return 'Invalid self_hash';
    if (!data.session_id || typeof data.session_id !== 'string')
        return 'Invalid session_id';
    if (typeof data.timestamp !== 'number')
        return 'Invalid timestamp';
    if (!data.mode || typeof data.mode !== 'string')
        return 'Invalid mode';
    const m = data.ciq_metrics || data.ciq || {};
    const hasMetrics = typeof m.clarity === 'number' && typeof m.integrity === 'number' && typeof m.quality === 'number';
    if (!hasMetrics)
        return 'Invalid ciq_metrics';
    return null;
}
const router = (0, express_1.Router)();
/**
 * POST /api/trust/receipts
 * Save a trust receipt with optional DID-based signatures
 */
router.post('/receipts', auth_middleware_1.protect, rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const receiptData = req.body;
        if (!receiptData || !receiptData.self_hash) {
            res.status(400).json({
                success: false,
                error: 'Invalid receipt data',
            });
            return;
        }
        if (typeof receiptData.self_hash !== 'string' || receiptData.self_hash.length < 16) {
            res.status(400).json({ success: false, error: 'Invalid self_hash format' });
            return;
        }
        if (receiptData.signature && typeof receiptData.signature !== 'string') {
            res.status(400).json({ success: false, error: 'Invalid signature format' });
            return;
        }
        {
            const schemaErr = validateReceiptPayload({
                self_hash: receiptData.self_hash,
                session_id: receiptData.session_id,
                timestamp: receiptData.timestamp,
                mode: receiptData.mode,
                ciq_metrics: receiptData.ciq_metrics || receiptData.ciq,
            });
            if (schemaErr) {
                res.status(400).json({ success: false, error: schemaErr });
                return;
            }
        }
        // Check if exists
        const existing = await trust_receipt_model_1.TrustReceiptModel.findOne({ self_hash: receiptData.self_hash });
        if (existing) {
            res.json({ success: true, saved: true, message: 'Receipt already exists' });
            return;
        }
        // Add DID fields if not present
        const platformDID = did_service_1.didService.getPlatformDID();
        const issuer = receiptData.issuer || platformDID;
        const subject = receiptData.subject || (receiptData.agent_id
            ? did_service_1.didService.getAgentDID(receiptData.agent_id)
            : undefined);
        const receipt = await trust_receipt_model_1.TrustReceiptModel.create({
            ...receiptData,
            tenant_id: req.tenant || 'default',
            issuer,
            subject,
        });
        res.status(201).json({
            success: true,
            saved: true,
            data: receipt,
        });
    }
    catch (error) {
        logger_1.default.error('Save receipt error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to save receipt',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/analytics
 * Get trust analytics for user's conversations or specific conversation
 *
 * Query params:
 * - conversationId?: string - Filter by conversation
 * - days?: number - Last N days (default: 7)
 * - limit?: number - Max evaluations to analyze (default: 1000)
 */
router.get('/analytics', auth_middleware_1.protect, rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { conversationId, days = 7, limit = 1000 } = req.query;
        // Build query filter
        const filter = { user: req.userId };
        if (conversationId) {
            filter._id = conversationId;
        }
        // Calculate time range
        const daysNum = Number(days);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysNum);
        // Fetch conversations
        const conversations = await conversation_model_1.Conversation.find(filter)
            .select('messages ethicalScore lastActivity')
            .sort({ lastActivity: -1 })
            .limit(Number(limit));
        // Collect all trust evaluations from messages
        const evaluations = [];
        for (const conversation of conversations) {
            for (const message of conversation.messages) {
                // Only process messages within time range
                if (message.timestamp < cutoffDate)
                    continue;
                // Only process messages with trust metadata
                if (!message.metadata?.trustEvaluation)
                    continue;
                // Reconstruct TrustEvaluation from metadata
                const evaluation = {
                    trustScore: message.metadata.trustEvaluation.trustScore,
                    status: message.metadata.trustEvaluation.status,
                    detection: message.metadata.trustEvaluation.detection,
                    receipt: message.metadata.trustEvaluation.receipt,
                    receiptHash: message.metadata.trustEvaluation.receiptHash,
                    timestamp: message.timestamp.getTime(),
                    messageId: message.metadata.messageId,
                    conversationId: conversation._id.toString(),
                };
                evaluations.push(evaluation);
            }
        }
        // Calculate analytics
        const analytics = await trust_service_1.trustService.getTrustAnalytics(evaluations);
        res.json({
            success: true,
            data: {
                analytics,
                timeRange: {
                    start: cutoffDate.toISOString(),
                    end: new Date().toISOString(),
                    days: daysNum,
                },
                conversationsAnalyzed: conversations.length,
                evaluationsCount: evaluations.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Trust analytics error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust analytics',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * POST /api/trust/evaluate
 * Evaluate a message and return trust scores
 *
 * Body:
 * {
 *   content: string,
 *   conversationId?: string,
 *   previousMessages?: Array<{ sender: string, content: string }>,
 *   sessionId?: string
 * }
 */
router.post('/evaluate', auth_middleware_1.protect, rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { content, conversationId, previousMessages = [], sessionId } = req.body;
        if (!content) {
            res.status(400).json({
                success: false,
                error: 'Message content is required',
            });
            return;
        }
        if (typeof content !== 'string' || content.length > 20000) {
            res.status(400).json({ success: false, error: 'Invalid content format or too long' });
            return;
        }
        if (!Array.isArray(previousMessages) || previousMessages.length > 50) {
            res.status(400).json({ success: false, error: 'previousMessages must be an array of max 50 items' });
            return;
        }
        // Build message object
        const message = {
            sender: 'user',
            content,
            metadata: {},
            ciModel: 'none',
            trustScore: 0,
            timestamp: new Date(),
        };
        // Build context
        const context = {
            conversationId: conversationId || sessionId || `temp-${Date.now()}`,
            sessionId: sessionId || conversationId,
            previousMessages: previousMessages.map((msg) => ({
                sender: msg.sender || 'user',
                content: msg.content,
                metadata: {},
                ciModel: 'none',
                trustScore: 0,
                timestamp: new Date(),
            })),
        };
        // Evaluate message
        const evaluation = await trust_service_1.trustService.evaluateMessage(message, context);
        res.json({
            success: true,
            data: {
                evaluation: {
                    trustScore: evaluation.trustScore,
                    status: evaluation.status,
                    detection: evaluation.detection,
                    receiptHash: evaluation.receiptHash,
                    timestamp: evaluation.timestamp,
                },
                principles: trust_service_1.trustService.getPrinciples(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Trust evaluation error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate message',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/receipts
 * Get trust receipts for a conversation or session
 *
 * Query params:
 * - conversationId?: string
 * - sessionId?: string
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
router.get('/receipts', auth_middleware_1.protect, async (req, res) => {
    try {
        const { conversationId, sessionId, limit = 50, offset = 0 } = req.query;
        if (!conversationId && !sessionId) {
            res.status(400).json({
                success: false,
                error: 'conversationId or sessionId is required',
            });
            return;
        }
        // Find conversation
        const conversation = await conversation_model_1.Conversation.findOne({
            _id: conversationId || sessionId,
            user: req.userId,
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
            return;
        }
        // Extract receipts from messages
        const receipts = conversation.messages
            .filter(msg => msg.metadata?.trustEvaluation?.receipt)
            .map(msg => ({
            messageId: msg.metadata.messageId,
            sender: msg.sender,
            timestamp: msg.timestamp,
            receipt: msg.metadata.trustEvaluation.receipt,
            receiptHash: msg.metadata.trustEvaluation.receiptHash,
            trustScore: msg.metadata.trustEvaluation.trustScore.overall,
            status: msg.metadata.trustEvaluation.status,
        }))
            .slice(Number(offset), Number(offset) + Number(limit));
        res.json({
            success: true,
            data: {
                receipts,
                total: conversation.messages.filter(msg => msg.metadata?.trustEvaluation?.receipt).length,
                limit: Number(limit),
                offset: Number(offset),
                conversationId: conversation._id,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get receipts error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust receipts',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * POST /api/trust/receipts/:receiptHash/verify
 * Verify a trust receipt's cryptographic signature
 *
 * Body:
 * {
 *   receipt: TrustReceipt object
 * }
 */
router.post('/receipts/:receiptHash/verify', auth_middleware_1.protect, rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { receiptHash } = req.params;
        const { receipt } = req.body;
        if (!receipt) {
            res.status(400).json({
                success: false,
                error: 'Receipt object is required',
            });
            return;
        }
        if (typeof receiptHash !== 'string' || receiptHash.length < 16) {
            res.status(400).json({ success: false, error: 'Invalid receiptHash' });
            return;
        }
        {
            const schemaErr = validateReceiptPayload({
                self_hash: receipt.self_hash || receipt.receiptHash || receipt.hash || receiptHash,
                session_id: receipt.session_id,
                timestamp: receipt.timestamp,
                mode: receipt.mode,
                ciq_metrics: receipt.ciq_metrics || receipt.ciq,
            });
            if (schemaErr) {
                res.status(400).json({ success: false, error: schemaErr });
                return;
            }
        }
        // Verify receipt hash matches (support multiple hash field names)
        const receiptHashValue = receipt.self_hash || receipt.receiptHash || receipt.hash;
        if (receiptHashValue !== receiptHash) {
            res.status(400).json({
                success: false,
                error: 'Receipt hash mismatch',
                expected: receiptHash,
                actual: receiptHashValue,
            });
            return;
        }
        // Check if receipt exists in database by hash
        let foundInDatabase = false;
        let dbReceipt = null;
        // Search in conversations for matching receipt hash
        const conversations = await conversation_model_1.Conversation.find({
            'messages.metadata.trustEvaluation.receiptHash': receiptHash,
        }).select('messages').lean();
        for (const conv of conversations) {
            for (const msg of conv.messages || []) {
                if (msg.metadata?.trustEvaluation?.receiptHash === receiptHash) {
                    foundInDatabase = true;
                    dbReceipt = msg.metadata.trustEvaluation;
                    break;
                }
            }
            if (foundInDatabase)
                break;
        }
        // Also search in TrustReceipt collection if exists
        if (!foundInDatabase) {
            try {
                const { TrustReceiptModel } = require('../models/trust-receipt.model');
                const stored = await TrustReceiptModel.findOne({ self_hash: receiptHash }).lean();
                if (stored) {
                    foundInDatabase = true;
                    dbReceipt = stored;
                }
            }
            catch (e) {
                // Model might not exist, continue
            }
        }
        // Determine validity through multiple verification methods
        let isValid = false;
        let hashValid = false;
        let signatureValid = false;
        // Method 1: Try cryptographic signature verification if receipt has proper structure
        if (receipt.version && receipt.session_id && receipt.timestamp && receipt.mode && receipt.ciq_metrics) {
            try {
                // Normalize self_hash
                if (!receipt.self_hash && receiptHashValue) {
                    receipt.self_hash = receiptHashValue;
                }
                const trustReceipt = new core_1.TrustReceipt(receipt);
                // Check if hash matches (recalculate and compare)
                hashValid = trustReceipt.self_hash === receiptHashValue;
                // If receipt has a signature, verify it cryptographically
                if (receipt.signature) {
                    trustReceipt.signature = receipt.signature;
                    signatureValid = await trust_service_1.trustService.verifyReceipt(trustReceipt);
                    if (signatureValid)
                        isValid = true;
                }
                else if (hashValid) {
                    // No signature but hash is valid - partial verification
                    isValid = true;
                }
            }
            catch (e) {
                // Structure verification failed
                logger_1.default.warn('Cryptographic verification failed', { error: e?.message || e });
            }
        }
        // Method 2: Database lookup as fallback
        if (!isValid && foundInDatabase) {
            isValid = true;
        }
        // Get public key for response (so clients can verify independently)
        let publicKey;
        try {
            const { keysService } = require('../services/keys.service');
            publicKey = await keysService.getPublicKeyHex();
        }
        catch (e) {
            // Keys service not available
        }
        res.json({
            success: true,
            data: {
                valid: isValid,
                foundInDatabase,
                receipt: dbReceipt || {
                    hash: receiptHashValue,
                    ...receipt,
                },
                verification: {
                    signatureValid,
                    hashValid,
                    inDatabase: foundInDatabase,
                    verifiedAt: new Date().toISOString(),
                    publicKey, // Include public key for independent verification
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Verify receipt error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to verify trust receipt',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/principles
 * Get the 6 constitutional principles and their definitions
 */
router.get('/principles', auth_middleware_1.protect, async (req, res) => {
    try {
        const principles = trust_service_1.trustService.getPrinciples();
        res.json({
            success: true,
            data: {
                principles,
                description: 'The 6 Constitutional Principles of the SONATE Trust Framework',
                totalWeight: Object.values(principles).reduce((sum, p) => sum + p.weight, 0),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get principles error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve principles',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/signing-key
 * Get the public key used for signing trust receipts
 */
router.get('/signing-key', async (req, res) => {
    try {
        const { keysService } = require('../services/keys.service');
        await keysService.initialize();
        const publicKey = await keysService.getPublicKeyHex();
        res.json({
            success: true,
            data: {
                publicKey,
                algorithm: 'Ed25519',
                usage: 'Trust receipt signature verification',
                format: 'hex',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get signing key error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve signing key',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/health
 * Get overall trust health for user's conversations
 */
router.get('/health', auth_middleware_1.protect, rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const conversations = await conversation_model_1.Conversation.find({ user: req.userId })
            .select('ethicalScore messages lastActivity')
            .sort({ lastActivity: -1 });
        // Calculate overall health metrics
        const totalConversations = conversations.length;
        const avgEthicalScore = conversations.reduce((sum, conv) => sum + (conv.ethicalScore || 0), 0) / totalConversations || 0;
        // Count conversations with trust issues
        const lowTrustConversations = conversations.filter(conv => (conv.ethicalScore || 0) < 3).length;
        const mediumTrustConversations = conversations.filter(conv => (conv.ethicalScore || 0) >= 3 && (conv.ethicalScore || 0) < 4).length;
        const highTrustConversations = conversations.filter(conv => (conv.ethicalScore || 0) >= 4).length;
        // Count recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivity = conversations.filter(conv => conv.lastActivity >= sevenDaysAgo).length;
        res.json({
            success: true,
            data: {
                overallHealth: {
                    averageEthicalScore: Math.round(avgEthicalScore * 100) / 100,
                    totalConversations,
                    recentActivity: {
                        last7Days: recentActivity,
                        percentage: Math.round((recentActivity / totalConversations) * 100) || 0,
                    },
                },
                trustDistribution: {
                    low: {
                        count: lowTrustConversations,
                        percentage: Math.round((lowTrustConversations / totalConversations) * 100) || 0,
                        threshold: '< 3.0',
                    },
                    medium: {
                        count: mediumTrustConversations,
                        percentage: Math.round((mediumTrustConversations / totalConversations) * 100) || 0,
                        threshold: '3.0 - 3.9',
                    },
                    high: {
                        count: highTrustConversations,
                        percentage: Math.round((highTrustConversations / totalConversations) * 100) || 0,
                        threshold: '>= 4.0',
                    },
                },
                recommendations: generateRecommendations(avgEthicalScore, lowTrustConversations, totalConversations),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Trust health error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust health',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * Helper: Generate recommendations based on trust metrics
 */
function generateRecommendations(avgScore, lowTrustCount, totalCount) {
    const recommendations = [];
    if (avgScore < 3.0) {
        recommendations.push('Overall trust score is low. Review AI agent configurations and enable Constitutional AI oversight.');
    }
    const lowTrustPercentage = (lowTrustCount / totalCount) * 100;
    if (lowTrustPercentage > 20) {
        recommendations.push(`${Math.round(lowTrustPercentage)}% of conversations have low trust scores. Consider enabling stricter trust protocols.`);
    }
    if (avgScore >= 4.0) {
        recommendations.push('Trust health is excellent. Continue current practices.');
    }
    if (totalCount < 5) {
        recommendations.push('Insufficient data for comprehensive analysis. Continue using the platform to build trust history.');
    }
    return recommendations;
}
/**
 * GET /api/trust/receipts/by-did/:did
 * Get trust receipts for a specific DID (subject or issuer)
 */
router.get('/receipts/by-did/:did', auth_middleware_1.protect, async (req, res) => {
    try {
        const { did } = req.params;
        const { role = 'subject', limit = 50, offset = 0 } = req.query;
        // Decode the DID (might be URL encoded)
        const decodedDID = decodeURIComponent(String(did));
        // Build query based on role
        const query = {};
        if (role === 'issuer') {
            query.issuer = decodedDID;
        }
        else {
            query.subject = decodedDID;
        }
        const receipts = await trust_receipt_model_1.TrustReceiptModel.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await trust_receipt_model_1.TrustReceiptModel.countDocuments(query);
        res.json({
            success: true,
            data: {
                receipts,
                did: decodedDID,
                role,
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get receipts by DID error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve receipts by DID',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/did-info
 * Get DID information for the trust service
 */
router.get('/did-info', async (req, res) => {
    try {
        const platformDID = did_service_1.didService.getPlatformDID();
        res.json({
            success: true,
            data: {
                platformDID,
                domain: did_service_1.didService.PLATFORM_DOMAIN,
                didDocumentUrl: `https://${did_service_1.didService.PLATFORM_DOMAIN}/.well-known/did.json`,
                supportedMethods: ['did:web'],
                description: 'Platform DID for signing trust receipts as Verifiable Credentials',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get DID info error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve DID info',
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * GET /api/trust/receipts/list
 * List trust receipts by tenant (current user tenant) with pagination
 * Query: limit, offset
 */
router.get('/receipts/list', auth_middleware_1.protect, rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const tenantId = req.userTenant || req.tenant || 'default';
        const receipts = await trust_receipt_model_1.TrustReceiptModel.find({ tenant_id: tenantId })
            .sort({ createdAt: -1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();
        const total = await trust_receipt_model_1.TrustReceiptModel.countDocuments({ tenant_id: tenantId });
        res.json({
            success: true,
            data: receipts,
            pagination: { total, limit: Number(limit), offset: Number(offset) },
        });
    }
    catch (error) {
        logger_1.default.error('List receipts error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to list receipts', message: (0, error_utils_1.getErrorMessage)(error) });
    }
});
/**
 * GET /api/trust/receipts/:receiptHash
 * Fetch a single trust receipt by hash
 */
router.get('/receipts/:receiptHash', auth_middleware_1.protect, rate_limiters_1.apiGatewayLimiter, async (req, res) => {
    try {
        const { receiptHash } = req.params;
        if (!receiptHash || receiptHash.length < 16) {
            res.status(400).json({ success: false, error: 'Invalid receiptHash' });
            return;
        }
        const receipt = await trust_receipt_model_1.TrustReceiptModel.findOne({ self_hash: receiptHash }).lean();
        if (!receipt) {
            res.status(404).json({ success: false, error: 'Receipt not found' });
            return;
        }
        res.json({ success: true, data: receipt });
    }
    catch (error) {
        logger_1.default.error('Get receipt by hash error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch receipt', message: (0, error_utils_1.getErrorMessage)(error) });
    }
});
exports.default = router;
