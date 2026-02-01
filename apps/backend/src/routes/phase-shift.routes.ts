/**
 * Phase-Shift Velocity API Routes
 * 
 * Exposes phase-shift velocity metrics for conversations.
 * Phase-shift velocity measures behavioral drift using vector math:
 * velocity = √(ΔResonance² + ΔCanvas²) ÷ ΔTime
 */

import { Router, Request, Response } from 'express';
import { ConversationModel } from '../models/conversation.model';
import { authenticateToken } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

interface PhaseShiftMetrics {
  conversationId: string;
  currentVelocity: number;
  alertLevel: 'none' | 'yellow' | 'red';
  deltaResonance: number;
  deltaCanvas: number;
  identityStability: number;
  transitionType?: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
  timestamp: number;
  turnNumber: number;
}

interface PhaseShiftHistory {
  conversationId: string;
  history: Array<{
    turnNumber: number;
    timestamp: number;
    velocity: number;
    alertLevel: 'none' | 'yellow' | 'red';
    deltaResonance: number;
    deltaCanvas: number;
  }>;
  summary: {
    avgVelocity: number;
    maxVelocity: number;
    alertCount: {
      yellow: number;
      red: number;
    };
    totalTurns: number;
  };
}

/**
 * GET /api/phase-shift/conversation/:conversationId
 * Get current phase-shift metrics for a conversation
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

    // Extract phase-shift data from the last AI message
    const aiMessages = conversation.messages.filter(m => m.sender === 'ai');
    
    if (aiMessages.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No AI messages in conversation yet',
      });
    }

    const lastAiMessage = aiMessages[aiMessages.length - 1];
    const phaseShiftData = lastAiMessage.metadata?.trustEvaluation?.phaseShift;

    if (!phaseShiftData) {
      return res.json({
        success: true,
        data: null,
        message: 'Phase-shift tracking not available for this conversation',
      });
    }

    const metrics: PhaseShiftMetrics = {
      conversationId,
      currentVelocity: phaseShiftData.velocity || 0,
      alertLevel: phaseShiftData.alertLevel || 'none',
      deltaResonance: phaseShiftData.deltaResonance || 0,
      deltaCanvas: phaseShiftData.deltaCanvas || 0,
      identityStability: phaseShiftData.identityStability || 1.0,
      transitionType: phaseShiftData.transitionType,
      timestamp: lastAiMessage.timestamp?.getTime() || Date.now(),
      turnNumber: aiMessages.length,
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error fetching phase-shift metrics:', error);
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/phase-shift/conversation/:conversationId/history
 * Get phase-shift velocity history for a conversation
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

    // Extract phase-shift data from all AI messages
    const aiMessages = conversation.messages.filter(m => m.sender === 'ai');
    
    if (aiMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          conversationId,
          history: [],
          summary: {
            avgVelocity: 0,
            maxVelocity: 0,
            alertCount: { yellow: 0, red: 0 },
            totalTurns: 0,
          },
        },
      });
    }

    const history: PhaseShiftHistory['history'] = [];
    let yellowCount = 0;
    let redCount = 0;
    let totalVelocity = 0;
    let maxVelocity = 0;

    aiMessages.forEach((message, index) => {
      const phaseShiftData = message.metadata?.trustEvaluation?.phaseShift;
      
      if (phaseShiftData) {
        const velocity = phaseShiftData.velocity || 0;
        const alertLevel = phaseShiftData.alertLevel || 'none';

        history.push({
          turnNumber: index + 1,
          timestamp: message.timestamp?.getTime() || Date.now(),
          velocity,
          alertLevel,
          deltaResonance: phaseShiftData.deltaResonance || 0,
          deltaCanvas: phaseShiftData.deltaCanvas || 0,
        });

        totalVelocity += velocity;
        maxVelocity = Math.max(maxVelocity, velocity);

        if (alertLevel === 'yellow') yellowCount++;
        if (alertLevel === 'red') redCount++;
      }
    });

    const result: PhaseShiftHistory = {
      conversationId,
      history,
      summary: {
        avgVelocity: history.length > 0 ? totalVelocity / history.length : 0,
        maxVelocity,
        alertCount: {
          yellow: yellowCount,
          red: redCount,
        },
        totalTurns: aiMessages.length,
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching phase-shift history:', error);
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/phase-shift/tenant/summary
 * Get phase-shift summary across all conversations for a tenant
 */
router.get('/tenant/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';

    // Fetch all conversations for user
    const conversations = await ConversationModel.find({
      user: userId,
    }).select('_id messages');

    let totalAlerts = { yellow: 0, red: 0 };
    let totalConversations = 0;
    let conversationsWithAlerts = 0;
    let highestVelocity = 0;
    let highestVelocityConversation: string | null = null;

    conversations.forEach(conversation => {
      const aiMessages = conversation.messages.filter(m => m.sender === 'ai');
      let hasAlerts = false;

      aiMessages.forEach(message => {
        const phaseShiftData = message.metadata?.trustEvaluation?.phaseShift;
        
        if (phaseShiftData) {
          const velocity = phaseShiftData.velocity || 0;
          const alertLevel = phaseShiftData.alertLevel || 'none';

          if (alertLevel === 'yellow') {
            totalAlerts.yellow++;
            hasAlerts = true;
          }
          if (alertLevel === 'red') {
            totalAlerts.red++;
            hasAlerts = true;
          }

          if (velocity > highestVelocity) {
            highestVelocity = velocity;
            highestVelocityConversation = conversation._id.toString();
          }
        }
      });

      if (hasAlerts) conversationsWithAlerts++;
      totalConversations++;
    });

    res.json({
      success: true,
      data: {
        tenantId,
        totalConversations,
        conversationsWithAlerts,
        totalAlerts,
        highestVelocity,
        highestVelocityConversation,
        alertRate: totalConversations > 0 ? conversationsWithAlerts / totalConversations : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching tenant phase-shift summary:', error);
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

export default router;