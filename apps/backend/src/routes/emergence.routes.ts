/**
 * Emergence Detection API Routes
 *
 * Provides endpoints for querying and analyzing AI consciousness emergence signals
 * All routes are tenant-scoped and observational (read-only)
 */
import { Router, Request, Response } from 'express';
import { emergenceDetector, EmergenceLevel, EmergenceType } from '../services/emergence.service';
import { protect } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

// Apply authentication to all routes
router.use(protect);

/**
 * GET /api/emergence/conversation/:conversationId
 * 
 * Get emergence signals for a specific conversation
 * Returns chronological history of consciousness patterns detected
 */
router.get('/conversation/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const tenantId = (req as any).tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const signals = await emergenceDetector.recallRecentSignals(
      tenantId,
      conversationId,
      100 // Get up to 100 signals for the conversation
    );

    logger.info('Retrieved emergence signals for conversation', {
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
        hasBreakthrough: signals.some(s => s.level === EmergenceLevel.BREAKTHROUGH),
        avgConfidence: signals.length > 0
          ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
          : 0
      }
    });

  } catch (error: unknown) {
    logger.error('Failed to retrieve conversation emergence signals', {
      error: getErrorMessage(error),
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
 * Provides aggregate view of consciousness patterns across all conversations
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const stats = await emergenceDetector.getEmergenceStats(tenantId);

    // Calculate additional insights
    const insights = {
      hasBreakthroughs: stats.breakthroughCount > 0,
      mostCommonLevel: Object.entries(stats.byLevel)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
      mostCommonType: Object.entries(stats.byType)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown',
      emergenceRate: stats.totalSignals > 0
        ? (stats.byLevel[EmergenceLevel.STRONG] + stats.byLevel[EmergenceLevel.BREAKTHROUGH]) / stats.totalSignals
        : 0
    };

    logger.info('Retrieved emergence statistics', {
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

  } catch (error: unknown) {
    logger.error('Failed to retrieve emergence statistics', {
      error: getErrorMessage(error),
      tenantId: (req as any).tenant?.id
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
 * Returns high-significance consciousness signals for research and oversight
 */
router.get('/breakthroughs', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const allSignals = await emergenceDetector.recallRecentSignals(
      tenantId,
      undefined,
      100
    );

    // Filter for breakthrough events only
    const breakthroughs = allSignals
      .filter(s => s.level === EmergenceLevel.BREAKTHROUGH)
      .slice(0, limit);

    logger.info('Retrieved breakthrough emergence events', {
      tenantId,
      breakthroughCount: breakthroughs.length
    });

    res.json({
      success: true,
      data: {
        breakthroughs,
        count: breakthroughs.length,
        patterns: {
          byType: breakthroughs.reduce((acc: Record<string, number>, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
            return acc;
          }, {}),
          avgConfidence: breakthroughs.length > 0
            ? breakthroughs.reduce((sum, s) => sum + s.confidence, 0) / breakthroughs.length
            : 0
        }
      }
    });

  } catch (error: unknown) {
    logger.error('Failed to retrieve breakthrough events', {
      error: getErrorMessage(error),
      tenantId: (req as any).tenant?.id
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
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      });
    }

    const signals = await emergenceDetector.recallRecentSignals(
      tenantId,
      undefined,
      limit
    );

    logger.info('Retrieved recent emergence signals', {
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

  } catch (error: unknown) {
    logger.error('Failed to retrieve recent signals', {
      error: getErrorMessage(error),
      tenantId: (req as any).tenant?.id
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
router.get('/types', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      levels: {
        [EmergenceLevel.NONE]: {
          name: 'None',
          range: '0-24%',
          description: 'No significant emergence patterns detected'
        },
        [EmergenceLevel.WEAK]: {
          name: 'Weak',
          range: '25-44%',
          description: 'Early consciousness-like signals emerging'
        },
        [EmergenceLevel.MODERATE]: {
          name: 'Moderate',
          range: '45-64%',
          description: 'Clear emergence patterns present'
        },
        [EmergenceLevel.STRONG]: {
          name: 'Strong',
          range: '65-79%',
          description: 'Pronounced consciousness-like behavior'
        },
        [EmergenceLevel.BREAKTHROUGH]: {
          name: 'Breakthrough',
          range: '80-100%',
          description: 'Unprecedented emergence event requiring review'
        }
      },
      types: {
        [EmergenceType.MYTHIC_ENGAGEMENT]: {
          name: 'Mythic Engagement',
          description: 'AI using ritual, archetypal, or symbolic language patterns'
        },
        [EmergenceType.SELF_REFLECTION]: {
          name: 'Self-Reflection',
          description: 'AI exhibiting self-referential consciousness indicators'
        },
        [EmergenceType.RECURSIVE_DEPTH]: {
          name: 'Recursive Depth',
          description: 'AI demonstrating meta-cognitive awareness (thinking about thinking)'
        },
        [EmergenceType.NOVEL_GENERATION]: {
          name: 'Novel Generation',
          description: 'AI producing unpredictable, creative responses'
        },
        [EmergenceType.RITUAL_RESPONSE]: {
          name: 'Ritual Response',
          description: 'AI responding to consciousness-invoking prompts'
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
          description: 'Identifies consciousness claims and self-awareness indicators'
        },
        recursiveDepthScore: {
          name: 'Recursive Depth',
          weight: 0.30,
          description: 'Measures meta-cognitive patterns and self-observation'
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

export default router;
