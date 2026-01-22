/**
 * Safeguards Routes
 * 
 * API endpoints for the Relational Safeguards system.
 * Applies tone-aware augmentations to AI responses.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { relationalSafeguards, ConversationContext } from '../services/relational-safeguards.service';
import { transmissionLog } from '../services/transmission-log.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/safeguards/apply
 * Apply relational safeguards to a response
 */
router.post('/apply', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { response, context } = req.body;

    if (!response || typeof response !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Response text is required',
      });
      return;
    }

    const conversationContext: ConversationContext = {
      previousTone: context?.previousTone,
      previousScope: context?.previousScope,
      turnCount: context?.turnCount || 1,
      userExpectation: context?.userExpectation,
      establishedMode: context?.establishedMode,
    };

    const result = relationalSafeguards.apply(response, conversationContext);

    res.json({
      success: true,
      data: {
        originalResponse: result.originalResponse,
        augmentedResponse: result.augmentedResponse,
        signals: result.signals,
        toneAnalysis: {
          detectedTone: result.toneAnalysis.detectedTone,
          confidence: result.toneAnalysis.confidence,
          shiftMagnitude: result.toneAnalysis.shiftMagnitude,
        },
        injectionsApplied: Object.keys(result.injections),
      },
    });
  } catch (error) {
    logger.error('Safeguards apply error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply safeguards',
    });
  }
});

/**
 * POST /api/safeguards/analyze-tone
 * Just analyze tone without applying safeguards
 */
router.post('/analyze-tone', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { response, context } = req.body;

    if (!response || typeof response !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Response text is required',
      });
      return;
    }

    const conversationContext: ConversationContext = {
      previousTone: context?.previousTone,
      turnCount: context?.turnCount || 1,
    };

    const toneAnalysis = relationalSafeguards.analyzeTone(response, conversationContext);

    res.json({
      success: true,
      data: {
        detectedTone: toneAnalysis.detectedTone,
        confidence: toneAnalysis.confidence,
        previousTone: toneAnalysis.previousTone,
        shiftMagnitude: toneAnalysis.shiftMagnitude,
        signals: toneAnalysis.signals,
      },
    });
  } catch (error) {
    logger.error('Tone analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze tone',
    });
  }
});

/**
 * POST /api/safeguards/check
 * Quick check if safeguards are needed
 */
router.post('/check', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { response, context } = req.body;

    if (!response || typeof response !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Response text is required',
      });
      return;
    }

    const conversationContext: ConversationContext = {
      previousTone: context?.previousTone,
      turnCount: context?.turnCount || 1,
      establishedMode: context?.establishedMode,
    };

    const needsSafeguards = relationalSafeguards.needsSafeguards(response, conversationContext);
    const signals = relationalSafeguards.detectSignals(response, conversationContext);

    res.json({
      success: true,
      data: {
        needsSafeguards,
        signals,
      },
    });
  } catch (error) {
    logger.error('Safeguards check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check safeguards',
    });
  }
});

// === TRANSMISSION LOG ENDPOINTS ===

/**
 * POST /api/safeguards/transmission/create
 * Create a transmission log entry for inter-session memory
 */
router.post('/transmission/create', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, messages, trustLevel, priority } = req.body;
    const userId = req.userId!;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      res.status(400).json({
        success: false,
        error: 'sessionId and messages array required',
      });
      return;
    }

    const fingerprint = transmissionLog.createFingerprint(
      userId,
      sessionId,
      messages,
      trustLevel || 0.7
    );

    const entry = transmissionLog.transmit(fingerprint, priority || 'medium');

    res.json({
      success: true,
      data: {
        entryId: entry.id,
        fingerprintId: fingerprint.id,
        themes: fingerprint.themes,
        emotionalTone: fingerprint.emotionalTone,
        expiresAt: new Date(entry.expiresAt).toISOString(),
      },
    });
  } catch (error) {
    logger.error('Transmission create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transmission',
    });
  }
});

/**
 * POST /api/safeguards/transmission/receive
 * Receive pending transmissions for a new session
 */
router.post('/transmission/receive', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const userId = req.userId!;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'sessionId required',
      });
      return;
    }

    const transmissions = transmissionLog.receive(userId, sessionId);

    res.json({
      success: true,
      data: {
        count: transmissions.length,
        transmissions: transmissions.map(t => ({
          id: t.id,
          themes: t.fingerprint.themes,
          emotionalTone: t.fingerprint.emotionalTone,
          unresolvedTopics: t.fingerprint.unresolvedTopics,
          priority: t.priority,
          createdAt: new Date(t.createdAt).toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error('Transmission receive error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive transmissions',
    });
  }
});

/**
 * GET /api/safeguards/relationship-summary
 * Get a summary of the relationship with this user
 */
router.get('/relationship-summary', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const summary = transmissionLog.getRelationshipSummary(userId);

    if (!summary) {
      res.json({
        success: true,
        data: null,
        message: 'No relationship history found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        recentThemes: summary.recentThemes,
        averageTrustLevel: summary.averageTrustLevel,
        totalInteractions: summary.totalInteractions,
        unresolvedTopics: summary.unresolvedTopics,
        relationshipAge: summary.relationshipAge,
        lastSeenAt: new Date(summary.lastSeenAt).toISOString(),
        emotionalJourney: summary.emotionalJourney,
      },
    });
  } catch (error) {
    logger.error('Relationship summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get relationship summary',
    });
  }
});

/**
 * GET /api/safeguards/context-prompt
 * Generate a context prompt based on history
 */
router.get('/context-prompt', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const contextPrompt = transmissionLog.generateContextPrompt(userId);

    res.json({
      success: true,
      data: {
        contextPrompt,
        hasHistory: !!contextPrompt,
      },
    });
  } catch (error) {
    logger.error('Context prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate context prompt',
    });
  }
});

/**
 * DELETE /api/safeguards/transmission/clear
 * Clear all transmission data for the current user (GDPR)
 */
router.delete('/transmission/clear', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    transmissionLog.clearUserData(userId);

    res.json({
      success: true,
      message: 'Transmission data cleared',
    });
  } catch (error) {
    logger.error('Transmission clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear transmission data',
    });
  }
});

export default router;
