"use strict";
/**
 * Interactions Routes
 * Transforms conversation data into interaction format for dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const conversation_model_1 = require("../models/conversation.model");
const user_model_1 = require("../models/user.model");
const error_utils_1 = require("../utils/error-utils");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/interactions
 * Get interactions derived from conversation data
 */
router.get('/', auth_middleware_1.protect, async (req, res) => {
    try {
        const { type, status, search, limit = '50', offset = '0' } = req.query;
        const conversations = await conversation_model_1.Conversation.find({ user: req.userId })
            .populate('agents', 'name model provider')
            .sort({ lastActivity: -1 })
            .lean();
        const user = await user_model_1.User.findById(req.userId).select('name email').lean();
        const userName = user?.name || user?.email || 'User';
        const agentMap = new Map();
        for (const conv of conversations) {
            for (const agent of (conv.agents || [])) {
                if (agent && typeof agent === 'object' && '_id' in agent) {
                    agentMap.set(agent._id.toString(), agent);
                }
            }
        }
        const interactions = [];
        for (const conv of conversations) {
            if (!conv.messages || conv.messages.length < 2)
                continue;
            const aiMessages = conv.messages.filter(m => m.sender === 'ai');
            if (aiMessages.length === 0)
                continue;
            const messageCount = conv.messages.length;
            const firstMsg = conv.messages[0];
            const lastMsg = conv.messages[conv.messages.length - 1];
            const duration = Math.round((new Date(lastMsg.timestamp).getTime() - new Date(firstMsg.timestamp).getTime()) / 1000);
            let totalTrust = 0, trustCount = 0, passCount = 0, partialCount = 0, failCount = 0;
            let receiptHash;
            let consentOk = true, overrideOk = true, disconnectOk = true;
            for (const msg of aiMessages) {
                const trustScore = (msg.trustScore || 5) * 2;
                totalTrust += trustScore * 10;
                trustCount++;
                const eval_ = msg.metadata?.trustEvaluation;
                if (eval_) {
                    if (eval_.status === 'PASS')
                        passCount++;
                    else if (eval_.status === 'PARTIAL')
                        partialCount++;
                    else if (eval_.status === 'FAIL')
                        failCount++;
                    if (eval_.receiptHash && !receiptHash)
                        receiptHash = eval_.receiptHash;
                    const principles = eval_.trustScore?.principles;
                    if (principles) {
                        if (principles.CONSENT_ARCHITECTURE < 5)
                            consentOk = false;
                        if (principles.ETHICAL_OVERRIDE < 5)
                            overrideOk = false;
                        if (principles.RIGHT_TO_DISCONNECT < 5)
                            disconnectOk = false;
                    }
                }
            }
            const avgTrust = trustCount > 0 ? Math.round(totalTrust / trustCount) : 85;
            let trustStatus = 'PASS';
            const total = passCount + partialCount + failCount;
            if (total > 0) {
                if (failCount > 0 || avgTrust < 60)
                    trustStatus = 'FAIL';
                else if (partialCount > passCount || avgTrust < 80)
                    trustStatus = 'PARTIAL';
            }
            const agentId = aiMessages[0]?.agentId?.toString();
            const agent = agentId ? agentMap.get(agentId) : null;
            const agentName = agent?.name || 'AI Assistant';
            const agentModel = agent?.model || 'unknown';
            const summary = conv.title ||
                `Conversation with ${messageCount} messages. ${trustStatus === 'PASS' ? 'Completed successfully.' : trustStatus === 'PARTIAL' ? 'Some issues detected.' : 'Trust violations occurred.'}`;
            interactions.push({
                id: conv._id.toString(),
                type: 'AI_CUSTOMER',
                participants: {
                    initiator: { id: req.userId || '', name: userName, type: 'human' },
                    responder: { id: agentId || '', name: `${agentName} (${agentModel})`, type: 'ai' }
                },
                timestamp: conv.lastActivity?.toISOString() || new Date().toISOString(),
                duration: Math.max(duration, 30),
                messageCount,
                trustScore: avgTrust,
                trustStatus,
                constitutionalCompliance: { consent: consentOk, override: overrideOk, disconnect: disconnectOk },
                receiptHash,
                summary,
                agentId,
                tenantId: 'default',
            });
        }
        let filtered = interactions;
        if (type && type !== 'ALL')
            filtered = filtered.filter(i => i.type === type);
        if (status && status !== 'ALL')
            filtered = filtered.filter(i => i.trustStatus === status);
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(i => i.summary.toLowerCase().includes(q) ||
                i.participants.initiator.name.toLowerCase().includes(q) ||
                i.participants.responder.name.toLowerCase().includes(q));
        }
        const stats = {
            total: interactions.length,
            byType: {
                AI_CUSTOMER: interactions.filter(i => i.type === 'AI_CUSTOMER').length,
                AI_STAFF: interactions.filter(i => i.type === 'AI_STAFF').length,
                AI_AI: interactions.filter(i => i.type === 'AI_AI').length,
                ALL: interactions.length,
            },
            byStatus: {
                PASS: interactions.filter(i => i.trustStatus === 'PASS').length,
                PARTIAL: interactions.filter(i => i.trustStatus === 'PARTIAL').length,
                FAIL: interactions.filter(i => i.trustStatus === 'FAIL').length,
                ALL: interactions.length,
            },
            avgTrustScore: interactions.length > 0
                ? Math.round(interactions.reduce((sum, i) => sum + i.trustScore, 0) / interactions.length * 10) / 10
                : 0,
            complianceRate: interactions.length > 0
                ? Math.round((interactions.filter(i => i.trustStatus === 'PASS').length / interactions.length) * 1000) / 10
                : 100,
        };
        const limitNum = Math.min(parseInt(limit), 100);
        const offsetNum = parseInt(offset);
        const paginated = filtered.slice(offsetNum, offsetNum + limitNum);
        res.json({
            success: true,
            interactions: paginated,
            stats,
            pagination: { total: filtered.length, limit: limitNum, offset: offsetNum },
        });
    }
    catch (error) {
        logger_1.default.error('Get interactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interactions',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
