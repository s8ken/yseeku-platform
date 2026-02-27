/**
 * Risk Events Routes
 * Track and manage risk events from trust violations
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation } from '../models/conversation.model';
import logger from '../utils/logger';
import { getErrorMessage, getErrorStack } from '../utils/error-utils';

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
        resolved: (conv as any).isResolved ?? false,
        created_at: conv.lastActivity.toISOString(),
        conversationId: conv._id.toString(),
        agentId: conv.agents && conv.agents.length > 0 ? conv.agents[0].toString() : undefined,
        metadata: {
          ethicalScore,
          trustPercentage,
          violationCount,
          violations: violations.slice(0, 5),
          messageCount: conv.messages.length,
          resolvedAt: (conv as any).resolvedAt?.toISOString(),
          resolvedBy: (conv as any).resolvedBy,
          resolutionNote: (conv as any).resolutionNote,
        },
      };

      riskEvents.push(event);
    }

    // Apply pagination after filtering by resolved status if requested
    const filteredByResolved = resolved === 'true'
      ? riskEvents.filter(e => e.resolved)
      : resolved === 'false'
        ? riskEvents.filter(e => !e.resolved)
        : riskEvents;

    const paginatedEvents = filteredByResolved.slice(offsetNum, offsetNum + limitNum);

    // Calculate summary statistics from real data
    const resolvedCount = riskEvents.filter(e => e.resolved).length;
    const summary = {
      total: riskEvents.length,
      critical: riskEvents.filter(e => e.severity === 'critical').length,
      error: riskEvents.filter(e => e.severity === 'error').length,
      warning: riskEvents.filter(e => e.severity === 'warning').length,
      resolved: resolvedCount,
      active: riskEvents.length - resolvedCount,
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
  } catch (error) {
    logger.error('Failed to query risk events', {
      error,
      stack: getErrorStack(error),
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
 * Mark a risk event (low-trust conversation) as resolved.
 * Persists resolution metadata to the conversation document.
 */
router.post('/:id/resolve', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { note } = req.body;

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

    if ((conversation as any).isResolved) {
      res.status(409).json({
        success: false,
        message: 'Risk event is already resolved',
        data: {
          id,
          resolved: true,
          resolvedAt: (conversation as any).resolvedAt?.toISOString(),
        },
      });
      return;
    }

    const resolvedAt = new Date();

    // Persist resolution to the conversation document
    await Conversation.updateOne(
      { _id: id },
      {
        $set: {
          isResolved: true,
          resolvedAt,
          resolvedBy: userId,
          resolutionNote: note ?? '',
        },
      }
    );

    logger.info('Risk event marked as resolved', {
      userId,
      conversationId: id,
      resolvedAt: resolvedAt.toISOString(),
    });

    res.json({
      success: true,
      message: 'Risk event marked as resolved',
      data: {
        id,
        resolved: true,
        resolvedAt: resolvedAt.toISOString(),
        resolvedBy: userId,
        resolutionNote: note ?? '',
      },
    });
  } catch (error) {
    logger.error('Failed to get risk event by ID', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resolve risk event',
      error: getErrorMessage(error),
    });
  }
});

export default router;
