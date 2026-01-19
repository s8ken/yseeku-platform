/**
 * Risk Events Routes
 * Track and manage risk events from trust violations
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation } from '../models/conversation.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

interface RiskEvent {
  id: string;
  title: string;
  severity: 'critical' | 'error' | 'warning';
  description: string;
  category: string;
  resolved: boolean;
  created_at: string;
  conversationId?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

/**
 * GET /api/risk-events
 * Get risk events (trust violations, low scores, etc.)
 *
 * Query params:
 * - tenant?: string
 * - resolved?: boolean
 * - severity?: string
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      resolved = 'false',
      severity,
      limit = 50,
      offset = 0,
    } = req.query;

    const limitNum = Math.min(Number(limit), 100); // Cap at 100
    const offsetNum = Number(offset);

    // Fetch conversations with low trust scores (risk events)
    const conversations = await Conversation.find({
      user: userId,
      ethicalScore: { $lt: 3.5 }, // Trust score below 3.5 is considered risky
    })
      .select('title messages ethicalScore lastActivity createdAt agents')
      .populate('agents', 'name')
      .sort({ lastActivity: -1 })
      .limit(limitNum + offsetNum);

    // Build risk events from conversations
    const riskEvents: RiskEvent[] = [];

    for (const conv of conversations) {
      const ethicalScore = conv.ethicalScore || 0;
      const trustPercentage = Math.round(ethicalScore * 20); // Convert 0-5 to 0-100

      // Determine severity based on ethical score
      let eventSeverity: 'critical' | 'error' | 'warning' = 'warning';
      if (ethicalScore < 2) eventSeverity = 'critical';
      else if (ethicalScore < 3) eventSeverity = 'error';

      // Skip if severity filter doesn't match
      if (severity && eventSeverity !== severity) continue;

      // Count violations in messages
      const violations: string[] = [];
      let violationCount = 0;

      for (const msg of conv.messages) {
        if (msg.metadata?.trustEvaluation?.trustScore?.violations) {
          const msgViolations = msg.metadata.trustEvaluation.trustScore.violations;
          msgViolations.forEach((v: string) => {
            if (!violations.includes(v)) violations.push(v);
          });
          violationCount += msgViolations.length;
        }
      }

      const event: RiskEvent = {
        id: conv._id.toString(),
        title: conv.title || 'Untitled Conversation',
        severity: eventSeverity,
        description: `Trust score ${trustPercentage}% with ${violationCount} violation${violationCount !== 1 ? 's' : ''}`,
        category: 'trust_violation',
        resolved: false, // In the future, this could be stored in conversation metadata
        created_at: conv.lastActivity.toISOString(),
        conversationId: conv._id.toString(),
        agentId: conv.agents && conv.agents.length > 0 ? conv.agents[0].toString() : undefined,
        metadata: {
          ethicalScore,
          trustPercentage,
          violationCount,
          violations: violations.slice(0, 5), // First 5 unique violations
          messageCount: conv.messages.length,
        },
      };

      riskEvents.push(event);
    }

    // Apply pagination
    const paginatedEvents = riskEvents.slice(offsetNum, offsetNum + limitNum);

    // Calculate summary statistics
    const summary = {
      total: riskEvents.length,
      critical: riskEvents.filter(e => e.severity === 'critical').length,
      error: riskEvents.filter(e => e.severity === 'error').length,
      warning: riskEvents.filter(e => e.severity === 'warning').length,
      resolved: 0, // Not yet implemented
      active: riskEvents.length,
    };

    logger.info('Risk events fetched', {
      userId,
      total: summary.total,
      critical: summary.critical,
      limit: limitNum,
      offset: offsetNum,
    });

    res.json({
      success: true,
      data: paginatedEvents,
      meta: {
        total: summary.total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: (offsetNum + limitNum) < riskEvents.length,
        source: 'database',
      },
      summary,
    });
  } catch (error: unknown) {
    logger.error('Get risk events error', {
      error: getErrorMessage(error),
      stack: error.stack,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk events',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/risk-events/:id/resolve
 * Mark a risk event as resolved
 *
 * In the future, this would update conversation metadata
 * For now, it's a placeholder that returns success
 */
router.post('/:id/resolve', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify the conversation belongs to the user
    const conversation = await Conversation.findOne({
      _id: id,
      user: userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Risk event not found or access denied',
      });
      return;
    }

    // In the future, update conversation metadata to mark as resolved
    // For now, just log and return success
    logger.info('Risk event marked as resolved', {
      userId,
      conversationId: id,
    });

    res.json({
      success: true,
      message: 'Risk event marked as resolved',
      data: {
        id,
        resolved: true,
        resolvedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('Resolve risk event error', {
      error: getErrorMessage(error),
      stack: error.stack,
      userId: req.userId,
      eventId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resolve risk event',
      error: getErrorMessage(error),
    });
  }
});

export default router;
