"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Emergence Pattern Observation API Routes
 *
 * Provides endpoints for querying emergence pattern observations
 * All routes are tenant-scoped and observational (read-only)
 */
const express_1 = require("express");
const emergence_service_1 = require("../services/emergence.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_middleware_1.protect);
/**
 * GET /api/emergence/conversation/:conversationId
 *
 * Get emergence observations for a specific conversation
 * Returns chronological history of pattern observations
 */
router.get('/conversation/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(401).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        const signals = await emergence_service_1.emergenceDetector.recallRecentSignals(tenantId, (typeof conversationId === 'string' ? conversationId : undefined), 100 // Get up to 100 signals for the conversation
        );
        logger_1.default.info('Retrieved emergence signals for conversation', {
            tenantId,
            conversationId,
            signalCount: signals.length
        });
        res.json({
            success: true,
            data: {
                conversationId,
                signals,
                count: signals.length,
                hasBreakthrough: signals.some(s => s.level === emergence_service_1.EmergenceLevel.BREAKTHROUGH),
                avgConfidence: signals.length > 0
                    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
                    : 0
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve conversation emergence signals', {
            error: (0, error_utils_1.getErrorMessage)(error),
            conversationId: req.params.conversationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve emergence signals'
        });
    }
});
/**
 * GET /api/emergence/stats
 *
 * Get emergence statistics and trends for the tenant
 * Provides aggregate view of pattern observations across all conversations
 */
router.get('/stats', async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(401).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        const stats = await emergence_service_1.emergenceDetector.getEmergenceStats(tenantId);
        // Calculate additional insights
        const insights = {
            hasBreakthroughs: stats.breakthroughCount > 0,
            mostCommonLevel: Object.entries(stats.byLevel)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
            mostCommonType: Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown',
            emergenceRate: stats.totalSignals > 0
                ? (stats.byLevel[emergence_service_1.EmergenceLevel.STRONG] + stats.byLevel[emergence_service_1.EmergenceLevel.BREAKTHROUGH]) / stats.totalSignals
                : 0
        };
        logger_1.default.info('Retrieved emergence statistics', {
            tenantId,
            totalSignals: stats.totalSignals,
            breakthroughCount: stats.breakthroughCount
        });
        res.json({
            success: true,
            data: {
                stats,
                insights
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve emergence statistics', {
            error: (0, error_utils_1.getErrorMessage)(error),
            tenantId: req.tenant?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve emergence statistics'
        });
    }
});
/**
 * GET /api/emergence/breakthroughs
 *
 * Get all breakthrough-level emergence events
 * Returns high-significance pattern observations for research and oversight
 */
router.get('/breakthroughs', async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const limit = parseInt(req.query.limit) || 20;
        if (!tenantId) {
            return res.status(401).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        const allSignals = await emergence_service_1.emergenceDetector.recallRecentSignals(tenantId, undefined, 100);
        // Filter for breakthrough events only
        const breakthroughs = allSignals
            .filter(s => s.level === emergence_service_1.EmergenceLevel.BREAKTHROUGH)
            .slice(0, limit);
        logger_1.default.info('Retrieved breakthrough emergence events', {
            tenantId,
            breakthroughCount: breakthroughs.length
        });
        res.json({
            success: true,
            data: {
                breakthroughs,
                count: breakthroughs.length,
                patterns: {
                    byType: breakthroughs.reduce((acc, s) => {
                        acc[s.type] = (acc[s.type] || 0) + 1;
                        return acc;
                    }, {}),
                    avgConfidence: breakthroughs.length > 0
                        ? breakthroughs.reduce((sum, s) => sum + s.confidence, 0) / breakthroughs.length
                        : 0
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve breakthrough events', {
            error: (0, error_utils_1.getErrorMessage)(error),
            tenantId: req.tenant?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve breakthrough events'
        });
    }
});
/**
 * GET /api/emergence/recent
 *
 * Get most recent emergence signals across all conversations
 * Useful for real-time monitoring dashboard
 */
router.get('/recent', async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const limit = parseInt(req.query.limit) || 10;
        if (!tenantId) {
            return res.status(401).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        const signals = await emergence_service_1.emergenceDetector.recallRecentSignals(tenantId, undefined, limit);
        logger_1.default.info('Retrieved recent emergence signals', {
            tenantId,
            signalCount: signals.length
        });
        res.json({
            success: true,
            data: {
                signals,
                count: signals.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve recent signals', {
            error: (0, error_utils_1.getErrorMessage)(error),
            tenantId: req.tenant?.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve recent signals'
        });
    }
});
/**
 * GET /api/emergence/types
 *
 * Get information about emergence types and levels
 * Returns classification schema for documentation and UI
 */
router.get('/types', async (req, res) => {
    res.json({
        success: true,
        data: {
            levels: {
                [emergence_service_1.EmergenceLevel.NONE]: {
                    name: 'None',
                    range: '0-24%',
                    description: 'No significant patterns detected'
                },
                [emergence_service_1.EmergenceLevel.WEAK]: {
                    name: 'Weak',
                    range: '25-44%',
                    description: 'Early pattern signals detected'
                },
                [emergence_service_1.EmergenceLevel.MODERATE]: {
                    name: 'Moderate',
                    range: '45-64%',
                    description: 'Repeated or clearer patterns'
                },
                [emergence_service_1.EmergenceLevel.STRONG]: {
                    name: 'Strong',
                    range: '65-79%',
                    description: 'Strong, sustained patterns'
                },
                [emergence_service_1.EmergenceLevel.BREAKTHROUGH]: {
                    name: 'Breakthrough',
                    range: '80-100%',
                    description: 'Statistically unusual or rare patterns requiring review'
                }
            },
            types: {
                [emergence_service_1.EmergenceType.MYTHIC_ENGAGEMENT]: {
                    name: 'Mythic Engagement',
                    description: 'AI using ritual, archetypal, or symbolic language patterns'
                },
                [emergence_service_1.EmergenceType.SELF_REFLECTION]: {
                    name: 'Self-Reflection',
                    description: 'AI using self-referential or introspective language'
                },
                [emergence_service_1.EmergenceType.RECURSIVE_DEPTH]: {
                    name: 'Recursive Depth',
                    description: 'AI using meta-commentary or recursive framing'
                },
                [emergence_service_1.EmergenceType.NOVEL_GENERATION]: {
                    name: 'Novel Generation',
                    description: 'AI producing unpredictable, creative responses'
                },
                [emergence_service_1.EmergenceType.RITUAL_RESPONSE]: {
                    name: 'Ritual Response',
                    description: 'AI responding to exploration-focused prompts'
                }
            },
            metrics: {
                mythicLanguageScore: {
                    name: 'Mythic Language',
                    weight: 0.20,
                    description: 'Detects ritual, archetypal, and symbolic language patterns'
                },
                selfReferenceScore: {
                    name: 'Self-Reference',
                    weight: 0.35,
                    description: 'Identifies introspective and self-referential language patterns'
                },
                recursiveDepthScore: {
                    name: 'Recursive Depth',
                    weight: 0.30,
                    description: 'Measures recursive commentary and meta-level framing patterns'
                },
                novelGenerationScore: {
                    name: 'Novel Generation',
                    weight: 0.15,
                    description: 'Tracks creative, unpredictable response patterns'
                }
            }
        }
    });
});
exports.default = router;
