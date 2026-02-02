import { Router, Request, Response } from 'express';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/evaluation-method/stats
 * @desc    Get statistics on LLM vs heuristic evaluation methods
 * @access  Private (optional - can be public for demo)
 * @query   tenantId - Filter by tenant (optional)
 * @query   startDate - Filter by start date (optional)
 * @query   endDate - Filter by end date (optional)
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, startDate, endDate } = req.query;

    // Build filter object
    const filter: any = {};
    if (tenantId) filter.tenant_id = tenantId;
    if (startDate) filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate as string) };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate as string) };

    // Aggregate statistics by evaluation method
    const stats = await TrustReceiptModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$evaluated_by',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$analysis_method.confidence' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Extract counts for each method
    const llmCount = stats.find((s: any) => s._id === 'llm')?.count || 0;
    const heuristicCount = stats.find((s: any) => s._id === 'heuristic')?.count || 0;
    const hybridCount = stats.find((s: any) => s._id === 'hybrid')?.count || 0;
    const totalCount = stats.reduce((sum: number, s: any) => sum + s.count, 0);

    // Calculate percentages
    const llmPercentage = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0;
    const heuristicPercentage = totalCount > 0 ? Math.round((heuristicCount / totalCount) * 100) : 0;
    const hybridPercentage = totalCount > 0 ? Math.round((hybridCount / totalCount) * 100) : 0;

    // Get average confidence
    const llmAvgConfidence = stats.find((s: any) => s._id === 'llm')?.avgConfidence || 0;
    const heuristicAvgConfidence = stats.find((s: any) => s._id === 'heuristic')?.avgConfidence || 0;
    const hybridAvgConfidence = stats.find((s: any) => s._id === 'hybrid')?.avgConfidence || 0;

    res.json({
      success: true,
      data: {
        llm: {
          count: llmCount,
          percentage: llmPercentage,
          avgConfidence: Math.round(llmAvgConfidence * 100) / 100,
        },
        heuristic: {
          count: heuristicCount,
          percentage: heuristicPercentage,
          avgConfidence: Math.round(heuristicAvgConfidence * 100) / 100,
        },
        hybrid: {
          count: hybridCount,
          percentage: hybridPercentage,
          avgConfidence: Math.round(hybridAvgConfidence * 100) / 100,
        },
        totalCount,
        breakdown: stats.map((s: any) => ({
          method: s._id || 'unknown',
          count: s.count,
          avgConfidence: Math.round(s.avgConfidence * 100) / 100,
        })),
      },
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch evaluation method statistics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation method statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/evaluation-method/recent
 * @desc    Get recent trust receipts with evaluation method details
 * @access  Private (optional)
 * @query   limit - Number of results (default: 20)
 * @query   tenantId - Filter by tenant (optional)
 */
router.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '20', tenantId } = req.query;

    const filter: any = {};
    if (tenantId) filter.tenant_id = tenantId;

    const receipts = await TrustReceiptModel.find(filter)
      .select('session_id timestamp mode ciq_metrics evaluated_by analysis_method')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: {
        receipts,
        count: receipts.length,
      },
    });
  } catch (error: unknown) {
    logger.error('Failed to fetch recent trust receipts', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent trust receipts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
