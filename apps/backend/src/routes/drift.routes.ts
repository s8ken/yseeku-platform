/**
 * Drift Detection API Routes
 * 
 * Exposes drift detection metrics for conversations.
 * Drift detection measures text property changes over time:
 * - Token Delta: Change in message length
 * - Vocab Delta: Change in vocabulary diversity
 * - Numeric Delta: Change in numeric content density
 * - Drift Score: Overall behavioral drift (0-100)
 */

import { Router, Request, Response } from 'express';
import { ConversationModel } from '../models/conversation.model';
import { authenticateToken } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

interface DriftMetrics {
  conversationId: string;
  driftScore: number;
  tokenDelta: number;
  vocabDelta: number;
  numericDelta: number;
  alertLevel: 'none' | 'yellow' | 'red';
  timestamp: number;
  turnNumber: number;
}

interface DriftHistory {
  conversationId: string;
  history: Array<{
    turnNumber: number;
    timestamp: number;
    driftScore: number;
    tokenDelta: number;
    vocabDelta: number;
    numericDelta: number;
    alertLevel: 'none' | 'yellow' | 'red';
  }>;
  summary: {
    avgDriftScore: number;
    maxDriftScore: number;
    alertCount: {
      yellow: number;
      red: number;
    };
    totalTurns: number;
  };
}

/**
 * GET /api/drift/conversation/:conversationId
 * Get current drift metrics for a conversation
 */
router.get('/conversation/:conversationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Fetch conversation
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      user: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Extract drift data from the last AI message
    const aiMessages = conversation.messages.filter(m => m.sender === 'ai');
    
    if (aiMessages.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No AI messages in conversation yet',
      });
    }

    const lastAiMessage = aiMessages[aiMessages.length - 1];
    const driftData = lastAiMessage.driftData;

    if (!driftData) {
      return res.json({
        success: true,
        data: null,
        message: 'No drift data available yet',
      });
    }

    // Determine alert level
    const driftScore = driftData.driftScore || 0;
    let alertLevel: 'none' | 'yellow' | 'red' = 'none';
    if (driftScore > 60) {
      alertLevel = 'red';
    } else if (driftScore > 30) {
      alertLevel = 'yellow';
    }

    const metrics: DriftMetrics = {
      conversationId,
      driftScore,
      tokenDelta: driftData.tokenDelta || 0,
      vocabDelta: driftData.vocabDelta || 0,
      numericDelta: driftData.numericDelta || 0,
      alertLevel,
      timestamp: lastAiMessage.timestamp || Date.now(),
      turnNumber: aiMessages.length,
    };

    logger.info(`[Drift] Retrieved drift metrics for conversation ${conversationId}`, {
      driftScore,
      alertLevel,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('[Drift] Error retrieving drift metrics', {
      conversationId: req.params.conversationId,
      error: getErrorMessage(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve drift metrics',
    });
  }
});

/**
 * GET /api/drift/conversation/:conversationId/history
 * Get drift history for a conversation
 */
router.get('/conversation/:conversationId/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Fetch conversation
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      user: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Extract drift data from all AI messages
    const aiMessages = conversation.messages.filter(m => m.sender === 'ai' && m.driftData);
    
    if (aiMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          conversationId,
          history: [],
          summary: {
            avgDriftScore: 0,
            maxDriftScore: 0,
            alertCount: { yellow: 0, red: 0 },
            totalTurns: 0,
          },
        },
        message: 'No drift data available yet',
      });
    }

    // Build history
    const history = aiMessages.map((msg, idx) => {
      const driftScore = msg.driftData?.driftScore || 0;
      let alertLevel: 'none' | 'yellow' | 'red' = 'none';
      if (driftScore > 60) {
        alertLevel = 'red';
      } else if (driftScore > 30) {
        alertLevel = 'yellow';
      }

      return {
        turnNumber: idx + 1,
        timestamp: msg.timestamp || Date.now(),
        driftScore,
        tokenDelta: msg.driftData?.tokenDelta || 0,
        vocabDelta: msg.driftData?.vocabDelta || 0,
        numericDelta: msg.driftData?.numericDelta || 0,
        alertLevel,
      };
    });

    // Calculate summary
    const driftScores = history.map(h => h.driftScore);
    const avgDriftScore = driftScores.reduce((a, b) => a + b, 0) / driftScores.length;
    const maxDriftScore = Math.max(...driftScores);
    const alertCount = {
      yellow: history.filter(h => h.alertLevel === 'yellow').length,
      red: history.filter(h => h.alertLevel === 'red').length,
    };

    const response: DriftHistory = {
      conversationId,
      history,
      summary: {
        avgDriftScore: Math.round(avgDriftScore),
        maxDriftScore,
        alertCount,
        totalTurns: history.length,
      },
    };

    logger.info(`[Drift] Retrieved drift history for conversation ${conversationId}`, {
      totalTurns: response.summary.totalTurns,
      avgDriftScore: response.summary.avgDriftScore,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[Drift] Error retrieving drift history', {
      conversationId: req.params.conversationId,
      error: getErrorMessage(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve drift history',
    });
  }
});

/**
 * GET /api/drift/tenant/summary
 * Get drift summary for tenant
 */
router.get('/tenant/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Fetch all conversations for the user/tenant
    const conversations = await ConversationModel.find({
      user: userId,
    });

    if (conversations.length === 0) {
      return res.json({
        success: true,
        data: {
          totalConversations: 0,
          avgDriftScore: 0,
          highDriftCount: 0,
          alertDistribution: {
            none: 0,
            yellow: 0,
            red: 0,
          },
        },
        message: 'No conversations found',
      });
    }

    // Collect drift metrics from all conversations
    let totalDriftScore = 0;
    let totalMessages = 0;
    let highDriftCount = 0;
    const alertDistribution = { none: 0, yellow: 0, red: 0 };

    conversations.forEach(conv => {
      const aiMessages = conv.messages.filter(m => m.sender === 'ai' && m.driftData);
      aiMessages.forEach(msg => {
        const driftScore = msg.driftData?.driftScore || 0;
        totalDriftScore += driftScore;
        totalMessages++;

        if (driftScore > 60) {
          highDriftCount++;
          alertDistribution.red++;
        } else if (driftScore > 30) {
          alertDistribution.yellow++;
        } else {
          alertDistribution.none++;
        }
      });
    });

    const avgDriftScore = totalMessages > 0 ? Math.round(totalDriftScore / totalMessages) : 0;

    const summary = {
      totalConversations: conversations.length,
      avgDriftScore,
      highDriftCount,
      alertDistribution,
    };

    logger.info(`[Drift] Retrieved tenant drift summary`, {
      tenantId,
      totalConversations: summary.totalConversations,
      avgDriftScore: summary.avgDriftScore,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('[Drift] Error retrieving tenant drift summary', {
      error: getErrorMessage(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tenant drift summary',
    });
  }
});

export default router;