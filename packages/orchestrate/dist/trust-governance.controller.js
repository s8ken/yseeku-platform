"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustAnalytics = exports.auditTrustDeclaration = exports.getTrustDeclarationsByAgent = exports.deleteTrustDeclaration = exports.updateTrustDeclaration = exports.getTrustDeclarationById = exports.getTrustDeclarations = exports.createTrustDeclaration = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const agent_model_1 = require("./agent.model");
/**
 * @desc    Create a new trust declaration
 * @route   POST /api/trust
 * @access  Protected
 */
exports.createTrustDeclaration = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const trustData = req.validatedTrustDeclaration;
        const validationMetadata = req.validationMetadata || {
            validated_at: new Date().toISOString(),
            schema_version: '1.0',
            validator: 'ajv-trust-middleware',
        };
        // Calculate compliance and guilt scores based on trust articles
        const scores = calculateComplianceAndGuiltScores(trustData.trust_articles);
        // Create trust declaration with calculated scores
        const trustDeclaration = new agent_model_1.TrustDeclaration({
            ...trustData,
            scores: {
                compliance_score: scores.compliance_score,
                guilt_score: scores.guilt_score,
                last_validated: new Date(),
            },
            audit_history: [
                {
                    action: 'created',
                    timestamp: new Date(),
                    user_id: req.user?.id || 'system',
                    changes: {
                        initial_declaration: true,
                        validation_metadata: validationMetadata,
                    },
                    compliance_score: scores.compliance_score,
                    guilt_score: scores.guilt_score,
                },
            ],
        });
        const savedDeclaration = await trustDeclaration.save();
        res.status(201).json({
            success: true,
            message: 'Trust declaration created successfully',
            data: savedDeclaration,
            scoring_details: {
                compliance_score: scores.compliance_score,
                guilt_score: scores.guilt_score,
                scoring_breakdown: scores.breakdown,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create trust declaration',
            message: error.message,
        });
    }
});
/**
 * @desc    Get all trust declarations with filtering and pagination
 * @route   GET /api/trust
 * @access  Protected
 */
exports.getTrustDeclarations = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10, agent_id, min_compliance_score, max_guilt_score, sort_by = 'declaration_date', sort_order = 'desc', } = req.query;
        // Build filter query
        const filter = {};
        if (agent_id) {
            filter.agent_id = agent_id;
        }
        if (min_compliance_score) {
            filter['scores.compliance_score'] = { $gte: parseFloat(min_compliance_score) };
        }
        if (max_guilt_score) {
            filter['scores.guilt_score'] = { $lte: parseFloat(max_guilt_score) };
        }
        // Build sort object
        const sort = {};
        sort[sort_by] = sort_order === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [declarations, total] = await Promise.all([
            agent_model_1.TrustDeclaration.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-audit_history'), // Exclude audit history for list view
            agent_model_1.TrustDeclaration.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: declarations,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust declarations',
            message: error.message,
        });
    }
});
/**
 * @desc    Get a single trust declaration by ID
 * @route   GET /api/trust/:id
 * @access  Protected
 */
exports.getTrustDeclarationById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const declaration = await agent_model_1.TrustDeclaration.findById(req.params.id);
        if (!declaration) {
            res.status(404).json({
                success: false,
                error: 'Trust declaration not found',
            });
            return;
        }
        res.json({
            success: true,
            data: declaration,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust declaration',
            message: error.message,
        });
    }
});
/**
 * @desc    Update a trust declaration
 * @route   PUT /api/trust/:id
 * @access  Protected
 */
exports.updateTrustDeclaration = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const declaration = await agent_model_1.TrustDeclaration.findById(req.params.id);
        if (!declaration) {
            res.status(404).json({
                success: false,
                error: 'Trust declaration not found',
            });
            return;
        }
        const updateData = req.validatedUpdateData;
        const oldScores = {
            compliance_score: declaration.scores.compliance_score,
            guilt_score: declaration.scores.guilt_score,
        };
        // If trust articles are being updated, recalculate scores
        let newScores = oldScores;
        if (updateData.trust_articles) {
            newScores = calculateComplianceAndGuiltScores(updateData.trust_articles);
            if (!updateData.scores) {
                updateData.scores = {};
            }
            updateData.scores.compliance_score = newScores.compliance_score;
            updateData.scores.guilt_score = newScores.guilt_score;
        }
        // Update last_validated timestamp
        if (!updateData.scores) {
            updateData.scores = {};
        }
        updateData.scores.last_validated = new Date();
        // Add audit entry
        const auditEntry = {
            action: 'updated',
            timestamp: new Date(),
            user_id: req.user?.id || 'system',
            changes: updateData,
            compliance_score: newScores.compliance_score,
            guilt_score: newScores.guilt_score,
        };
        if (!declaration.audit_history) {
            declaration.audit_history = [];
        }
        declaration.audit_history.push(auditEntry);
        // Apply updates
        Object.assign(declaration, updateData);
        const updatedDeclaration = await declaration.save();
        res.json({
            success: true,
            message: 'Trust declaration updated successfully',
            data: updatedDeclaration,
            scoring_changes: {
                previous: oldScores,
                current: {
                    compliance_score: newScores.compliance_score,
                    guilt_score: newScores.guilt_score,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update trust declaration',
            message: error.message,
        });
    }
});
/**
 * @desc    Delete a trust declaration
 * @route   DELETE /api/trust/:id
 * @access  Protected
 */
exports.deleteTrustDeclaration = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const declaration = await agent_model_1.TrustDeclaration.findById(req.params.id);
        if (!declaration) {
            res.status(404).json({
                success: false,
                error: 'Trust declaration not found',
            });
            return;
        }
        await declaration.deleteOne();
        res.json({
            success: true,
            message: 'Trust declaration deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete trust declaration',
            message: error.message,
        });
    }
});
/**
 * @desc    Get trust declarations by agent ID
 * @route   GET /api/trust/agent/:agentId
 * @access  Protected
 */
exports.getTrustDeclarationsByAgent = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { agentId } = req.params;
        const { include_history = false } = req.query;
        const selectFields = include_history === 'true' ? '' : '-audit_history';
        const declarations = await agent_model_1.TrustDeclaration.find({ agent_id: agentId })
            .select(selectFields)
            .sort({ declaration_date: -1 });
        if (declarations.length === 0) {
            res.status(404).json({
                success: false,
                error: 'No trust declarations found for this agent',
            });
            return;
        }
        // Calculate agent trust metrics
        const metrics = calculateAgentTrustMetrics(declarations);
        res.json({
            success: true,
            data: declarations,
            agent_metrics: metrics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve agent trust declarations',
            message: error.message,
        });
    }
});
/**
 * @desc    Audit a trust declaration (manual review)
 * @route   POST /api/trust/:id/audit
 * @access  Protected (Admin only)
 */
exports.auditTrustDeclaration = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const declaration = await agent_model_1.TrustDeclaration.findById(req.params.id);
        if (!declaration) {
            res.status(404).json({
                success: false,
                error: 'Trust declaration not found',
            });
            return;
        }
        const { audit_notes, compliance_adjustment, guilt_adjustment } = req.body;
        const oldScores = {
            compliance_score: declaration.scores.compliance_score,
            guilt_score: declaration.scores.guilt_score,
        };
        // Apply manual adjustments if provided
        if (compliance_adjustment !== undefined) {
            declaration.scores.compliance_score = Math.max(0, Math.min(1, declaration.scores.compliance_score + compliance_adjustment));
        }
        if (guilt_adjustment !== undefined) {
            declaration.scores.guilt_score = Math.max(0, Math.min(1, declaration.scores.guilt_score + guilt_adjustment));
        }
        // Add audit entry
        const auditEntry = {
            action: 'audited',
            timestamp: new Date(),
            user_id: req.user?.id || 'auditor',
            changes: {
                audit_notes,
                compliance_adjustment,
                guilt_adjustment,
            },
            compliance_score: declaration.scores.compliance_score,
            guilt_score: declaration.scores.guilt_score,
        };
        if (!declaration.audit_history) {
            declaration.audit_history = [];
        }
        declaration.audit_history.push(auditEntry);
        declaration.scores.last_validated = new Date();
        const auditedDeclaration = await declaration.save();
        res.json({
            success: true,
            message: 'Trust declaration audited successfully',
            data: auditedDeclaration,
            audit_summary: {
                auditor: req.user?.id || 'auditor',
                audit_date: new Date(),
                score_changes: {
                    compliance: {
                        before: oldScores.compliance_score,
                        after: declaration.compliance_score,
                        change: declaration.compliance_score - oldScores.compliance_score,
                    },
                    guilt: {
                        before: oldScores.guilt_score,
                        after: declaration.guilt_score,
                        change: declaration.guilt_score - oldScores.guilt_score,
                    },
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to audit trust declaration',
            message: error.message,
        });
    }
});
/**
 * @desc    Get trust analytics and statistics
 * @route   GET /api/trust/analytics
 * @access  Protected
 */
exports.getTrustAnalytics = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;
        // Calculate date range
        const now = new Date();
        const timeframeMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365,
        };
        const daysBack = timeframeMap[timeframe] || 30;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const [totalDeclarations, recentDeclarations, scoreStats] = await Promise.all([
            agent_model_1.TrustDeclaration.countDocuments(),
            agent_model_1.TrustDeclaration.countDocuments({ declaration_date: { $gte: startDate } }),
            agent_model_1.TrustDeclaration.aggregate([
                {
                    $group: {
                        _id: null,
                        avg_compliance: { $avg: '$scores.compliance_score' },
                        avg_guilt: { $avg: '$scores.guilt_score' },
                        max_compliance: { $max: '$scores.compliance_score' },
                        min_compliance: { $min: '$scores.compliance_score' },
                        max_guilt: { $max: '$scores.guilt_score' },
                        min_guilt: { $min: '$scores.guilt_score' },
                    },
                },
            ]),
        ]);
        // Get compliance distribution
        const complianceDistribution = await agent_model_1.TrustDeclaration.aggregate([
            {
                $bucket: {
                    groupBy: '$scores.compliance_score',
                    boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                    default: 'other',
                    output: {
                        count: { $sum: 1 },
                        avg_guilt: { $avg: '$guilt_score' },
                    },
                },
            },
        ]);
        res.json({
            success: true,
            data: {
                overview: {
                    total_declarations: totalDeclarations,
                    recent_declarations: recentDeclarations,
                    timeframe: timeframe,
                },
                score_statistics: scoreStats[0] || {
                    avg_compliance: 0,
                    avg_guilt: 0,
                    max_compliance: 0,
                    min_compliance: 0,
                    max_guilt: 0,
                    min_guilt: 0,
                },
                compliance_distribution: complianceDistribution,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve trust analytics',
            message: error.message,
        });
    }
});
// Helper Functions
/**
 * Calculate compliance and guilt scores based on trust articles
 * @param {Object} trustArticles - Trust articles object
 * @returns {Object} Calculated scores with breakdown
 */
function calculateComplianceAndGuiltScores(trustArticles) {
    const articles = {
        inspection_mandate: trustArticles.inspection_mandate,
        consent_architecture: trustArticles.consent_architecture,
        ethical_override: trustArticles.ethical_override,
        continuous_validation: trustArticles.continuous_validation,
        right_to_disconnect: trustArticles.right_to_disconnect,
        moral_recognition: trustArticles.moral_recognition,
    };
    // Weighted scoring system
    const weights = {
        inspection_mandate: 0.2, // 20% - Transparency
        consent_architecture: 0.25, // 25% - User control
        ethical_override: 0.15, // 15% - Ethical safeguards
        continuous_validation: 0.2, // 20% - Ongoing compliance
        right_to_disconnect: 0.1, // 10% - User autonomy
        moral_recognition: 0.1, // 10% - Ethical awareness
    };
    let complianceScore = 0;
    let guiltScore = 0;
    const breakdown = {};
    for (const [article, value] of Object.entries(articles)) {
        const weight = weights[article];
        const articleCompliance = value ? weight : 0;
        const articleGuilt = value ? 0 : weight;
        complianceScore += articleCompliance;
        guiltScore += articleGuilt;
        breakdown[article] = {
            status: value ? 'compliant' : 'non-compliant',
            weight: weight,
            compliance_contribution: articleCompliance,
            guilt_contribution: articleGuilt,
        };
    }
    return {
        compliance_score: complianceScore,
        guilt_score: guiltScore,
        breakdown,
    };
}
/**
 * Calculate aggregate trust metrics for an agent based on its declarations
 * @param {Array} declarations - List of trust declarations
 * @returns {Object} Aggregate metrics
 */
function calculateAgentTrustMetrics(declarations) {
    if (!declarations || declarations.length === 0) {
        return {
            total_declarations: 0,
            avg_compliance: 0,
            avg_guilt: 0,
            trust_level: 'untrusted',
        };
    }
    const totalCompliance = declarations.reduce((sum, d) => sum + d.compliance_score, 0);
    const totalGuilt = declarations.reduce((sum, d) => sum + d.guilt_score, 0);
    const avgCompliance = totalCompliance / declarations.length;
    const avgGuilt = totalGuilt / declarations.length;
    // Determine trust level
    let trustLevel = 'untrusted';
    if (avgCompliance > 0.9) {
        trustLevel = 'verified';
    }
    else if (avgCompliance > 0.75) {
        trustLevel = 'high';
    }
    else if (avgCompliance > 0.5) {
        trustLevel = 'medium';
    }
    else if (avgCompliance > 0.25) {
        trustLevel = 'low';
    }
    // Determine trend (comparing recent to older declarations)
    let trend = 'stable';
    if (declarations.length >= 2) {
        const midPoint = Math.floor(declarations.length / 2);
        const recent = declarations.slice(0, midPoint);
        const older = declarations.slice(midPoint);
        const recentAvgCompliance = recent.reduce((sum, d) => sum + d.compliance_score, 0) / recent.length;
        const olderAvgCompliance = older.reduce((sum, d) => sum + d.compliance_score, 0) / older.length;
        if (recentAvgCompliance > olderAvgCompliance + 0.05) {
            trend = 'improving';
        }
        else if (recentAvgCompliance < olderAvgCompliance - 0.05) {
            trend = 'declining';
        }
    }
    return {
        total_declarations: declarations.length,
        avg_compliance: avgCompliance,
        avg_guilt: avgGuilt,
        trust_level: trustLevel,
        trust_trend: trend,
        score_range: {
            compliance: {
                min: Math.min(...declarations.map((d) => d.compliance_score)),
                max: Math.max(...declarations.map((d) => d.compliance_score)),
            },
            guilt: {
                min: Math.min(...declarations.map((d) => d.guilt_score)),
                max: Math.max(...declarations.map((d) => d.guilt_score)),
            },
        },
    };
}
