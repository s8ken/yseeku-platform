import { Router, Request, Response } from 'express';
import { insightsGeneratorService } from '../services/insights-generator.service';
import { Insight, InsightsSummary } from '../types/insights.types';

const router = Router();

/**
 * GET /api/insights
 * Get actionable insights for current tenant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'demo-tenant';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const insights = await insightsGeneratorService.generateInsights(tenantId, limit);
    
    res.json({
      success: true,
      data: insights,
      count: insights.length,
      tenantId,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights',
    });
  }
});

/**
 * GET /api/insights/summary
 * Get insights summary statistics
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'demo-tenant';
    
    const summary = await insightsGeneratorService.getInsightsSummary(tenantId);
    
    res.json({
      success: true,
      data: summary,
      tenantId,
    });
  } catch (error) {
    console.error('Error fetching insights summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights summary',
    });
  }
});

/**
 * PATCH /api/insights/:id/status
 * Update insight status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, action } = req.body;
    
    const insight = await insightsGeneratorService.updateInsightStatus(
      id,
      status,
      action
    );
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found',
      });
    }
    
    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('Error updating insight status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update insight status',
    });
  }
});

export default router;