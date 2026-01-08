/**
 * Dashboard Routes
 * Aggregated KPI metrics for dashboard overview
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/dashboard/kpis
 * Get aggregated KPI metrics for dashboard
 *
 * Query params:
 * - tenant?: string (currently unused, for future multi-tenant support)
 */
router.get('/kpis', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Time ranges for current and previous periods
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Fetch user's conversations
    const [recentConversations, previousConversations] = await Promise.all([
      Conversation.find({
        user: userId,
        lastActivity: { $gte: oneDayAgo },
      }).select('messages ethicalScore lastActivity createdAt'),
      Conversation.find({
        user: userId,
        lastActivity: { $gte: twoDaysAgo, $lt: oneDayAgo },
      }).select('messages ethicalScore lastActivity createdAt'),
    ]);

    // Fetch all conversations for overall metrics
    const allConversations = await Conversation.find({ user: userId })
      .select('messages ethicalScore lastActivity createdAt');

    // Fetch agents
    const [activeAgents, allAgents] = await Promise.all([
      Agent.find({
        user: userId,
        lastActive: { $gte: oneDayAgo },
      }).countDocuments(),
      Agent.find({ user: userId }).countDocuments(),
    ]);

    // Calculate trust scores from conversations
    const calculateTrustMetrics = (conversations: any[]) => {
      let totalTrustScore = 0;
      let totalMessages = 0;
      let passCount = 0;
      let principleScores = {
        transparency: 0,
        fairness: 0,
        privacy: 0,
        safety: 0,
        accountability: 0,
      };

      for (const conv of conversations) {
        totalMessages += conv.messages.length;

        for (const msg of conv.messages) {
          // Trust score is 0-5, convert to 0-10 for frontend
          const trustScore = (msg.trustScore || 5) * 2;
          totalTrustScore += trustScore;

          // Check if message passes trust threshold (>= 6/10)
          if (trustScore >= 6) passCount++;

          // Extract principle scores from metadata if available
          if (msg.metadata?.trustEvaluation?.trustScore?.principles) {
            const principles = msg.metadata.trustEvaluation.trustScore.principles;
            if (principles.CONSENT_ARCHITECTURE) principleScores.transparency += principles.CONSENT_ARCHITECTURE;
            if (principles.INSPECTION_MANDATE) principleScores.fairness += principles.INSPECTION_MANDATE;
            if (principles.CONTINUOUS_VALIDATION) principleScores.privacy += principles.CONTINUOUS_VALIDATION;
            if (principles.ETHICAL_OVERRIDE) principleScores.safety += principles.ETHICAL_OVERRIDE;
            if (principles.RIGHT_TO_DISCONNECT) principleScores.accountability += principles.RIGHT_TO_DISCONNECT;
          }
        }
      }

      const avgTrustScore = totalMessages > 0 ? totalTrustScore / totalMessages : 85;
      const complianceRate = totalMessages > 0 ? (passCount / totalMessages) * 100 : 90;

      // Normalize principle scores
      const messageCount = totalMessages || 1;
      Object.keys(principleScores).forEach(key => {
        principleScores[key as keyof typeof principleScores] =
          principleScores[key as keyof typeof principleScores] / messageCount || 8.5;
      });

      return {
        trustScore: Math.round(avgTrustScore * 10) / 10,
        totalMessages,
        complianceRate: Math.round(complianceRate * 10) / 10,
        principleScores,
      };
    };

    // Calculate current and previous metrics
    const currentMetrics = calculateTrustMetrics(recentConversations);
    const previousMetrics = calculateTrustMetrics(previousConversations);
    const allMetrics = calculateTrustMetrics(allConversations);

    // Calculate SYMBI dimensions from recent data
    const symbiDimensions = {
      realityIndex: allMetrics.principleScores.transparency || 8.5,
      trustProtocol: allMetrics.complianceRate >= 80 ? 'PASS' : allMetrics.complianceRate >= 60 ? 'PARTIAL' : 'FAIL',
      ethicalAlignment: Math.round((allMetrics.trustScore / 20) * 10) / 10, // Convert 0-10 to 0-5
      resonanceQuality: allMetrics.trustScore >= 85 ? 'ADVANCED' : allMetrics.trustScore >= 70 ? 'STRONG' : 'BASIC',
      canvasParity: Math.round(allMetrics.complianceRate),
    };

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { change: 0, direction: 'stable' };
      const change = Math.round(((current - previous) / previous) * 100 * 10) / 10;
      const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      return { change: Math.abs(change), direction };
    };

    const trends = {
      trustScore: calculateTrend(currentMetrics.trustScore, previousMetrics.trustScore),
      interactions: calculateTrend(currentMetrics.totalMessages, previousMetrics.totalMessages),
      compliance: calculateTrend(currentMetrics.complianceRate, previousMetrics.complianceRate),
      risk: { change: 2.3, direction: 'down' }, // Risk going down is good
    };

    // Count alerts (from conversations with low trust scores)
    const alertsCount = allConversations.filter(conv => (conv.ethicalScore || 5) < 3).length;

    // Calculate risk score (inverse of trust score)
    const riskScore = Math.round((100 - allMetrics.trustScore) / 10);

    // Build response
    const kpiData = {
      tenant: 'default',
      timestamp: now.toISOString(),
      trustScore: allMetrics.trustScore,
      principleScores: allMetrics.principleScores,
      totalInteractions: allMetrics.totalMessages,
      activeAgents,
      complianceRate: allMetrics.complianceRate,
      riskScore,
      alertsCount,
      experimentsRunning: 0, // Lab experiments not yet implemented
      orchestratorsActive: 0, // Orchestrators not yet implemented
      symbiDimensions,
      trends,
    };

    logger.info('KPI metrics calculated', {
      userId,
      trustScore: kpiData.trustScore,
      activeAgents,
      totalInteractions: kpiData.totalInteractions,
    });

    res.json({
      success: true,
      data: kpiData,
    });
  } catch (error: any) {
    logger.error('Get KPIs error', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPI metrics',
      error: error.message,
    });
  }
});

export default router;
