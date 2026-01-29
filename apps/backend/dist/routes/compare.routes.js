"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const multi_model_comparison_service_1 = require("../services/multi-model-comparison.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * POST /api/compare
 * Run a multi-model comparison
 */
router.post('/', async (req, res) => {
    try {
        const validated = multi_model_comparison_service_1.ComparisonRequestSchema.parse(req.body);
        logger_1.logger.info('Starting multi-model comparison', { providers: validated.providers });
        const result = await multi_model_comparison_service_1.multiModelComparisonService.compare(validated);
        res.json({
            success: true,
            comparison: result
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        const err = error;
        logger_1.logger.error('Comparison failed', { error: err.message });
        res.status(500).json({
            success: false,
            error: 'Comparison failed',
            message: err.message
        });
    }
});
/**
 * GET /api/compare/:id
 * Get a specific comparison result
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const comparison = multi_model_comparison_service_1.multiModelComparisonService.getComparison(id);
    if (!comparison) {
        return res.status(404).json({
            success: false,
            error: 'Comparison not found'
        });
    }
    res.json({
        success: true,
        comparison
    });
});
/**
 * GET /api/compare
 * List recent comparisons
 */
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const comparisons = multi_model_comparison_service_1.multiModelComparisonService.listComparisons(limit);
    res.json({
        success: true,
        comparisons,
        count: comparisons.length
    });
});
/**
 * GET /api/compare/providers
 * Get available model providers
 */
router.get('/providers/list', (req, res) => {
    const providers = multi_model_comparison_service_1.multiModelComparisonService.getAvailableProviders();
    res.json({
        success: true,
        providers
    });
});
exports.default = router;
