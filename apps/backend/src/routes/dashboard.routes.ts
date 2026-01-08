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

/**
 * GET /api/dashboard/risk
 * Get risk assessment metrics and compliance reports
 *
 * Query params:
 * - tenant?: string (currently unused, for future multi-tenant support)
 */
router.get('/risk', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Fetch user's conversations for risk analysis
    const conversations = await Conversation.find({ user: userId })
      .select('messages ethicalScore lastActivity createdAt')
      .sort({ lastActivity: -1 });

    // Calculate trust principle scores from messages
    const principleScores = {
      consent: 0,
      inspection: 0,
      validation: 0,
      ethics: 0,
      disconnect: 0,
      moral: 0,
    };

    let totalMessages = 0;
    let lowTrustMessages = 0;

    for (const conv of conversations) {
      for (const msg of conv.messages) {
        if (!msg.metadata?.trustEvaluation?.trustScore?.principles) continue;

        const principles = msg.metadata.trustEvaluation.trustScore.principles;
        totalMessages++;

        // Map SYMBI principles to risk categories
        if (principles.CONSENT_ARCHITECTURE) principleScores.consent += principles.CONSENT_ARCHITECTURE;
        if (principles.INSPECTION_MANDATE) principleScores.inspection += principles.INSPECTION_MANDATE;
        if (principles.CONTINUOUS_VALIDATION) principleScores.validation += principles.CONTINUOUS_VALIDATION;
        if (principles.ETHICAL_OVERRIDE) principleScores.ethics += principles.ETHICAL_OVERRIDE;
        if (principles.RIGHT_TO_DISCONNECT) principleScores.disconnect += principles.RIGHT_TO_DISCONNECT;
        if (principles.MORAL_RECOGNITION) principleScores.moral += principles.MORAL_RECOGNITION;

        // Count low trust messages (score < 6/10)
        const trustScore = (msg.trustScore || 5) * 2; // Convert 0-5 to 0-10
        if (trustScore < 6) lowTrustMessages++;
      }
    }

    // Normalize principle scores (0-100)
    const messageCount = totalMessages || 1;
    Object.keys(principleScores).forEach(key => {
      principleScores[key as keyof typeof principleScores] =
        Math.round((principleScores[key as keyof typeof principleScores] / messageCount) * 10);
    });

    // Calculate overall risk score (inverse of trust, 0-100)
    const avgTrustScore = totalMessages > 0
      ? conversations.reduce((sum, conv) => sum + ((conv.ethicalScore || 5) * 20), 0) / conversations.length
      : 85;
    const overallRiskScore = Math.round(100 - avgTrustScore);

    // Determine risk level
    let riskLevel = 'low';
    if (overallRiskScore > 50) riskLevel = 'critical';
    else if (overallRiskScore > 30) riskLevel = 'high';
    else if (overallRiskScore > 15) riskLevel = 'medium';

    // Generate compliance reports
    const complianceReports = [
      {
        framework: 'EU AI Act',
        status: principleScores.ethics >= 80 ? 'compliant' : 'warning',
        score: principleScores.ethics,
        lastAudit: new Date().toISOString(),
      },
      {
        framework: 'GDPR',
        status: principleScores.consent >= 85 ? 'compliant' : 'warning',
        score: principleScores.consent,
        lastAudit: new Date().toISOString(),
      },
      {
        framework: 'ISO 27001',
        status: principleScores.inspection >= 80 ? 'compliant' : 'warning',
        score: principleScores.inspection,
        lastAudit: new Date().toISOString(),
      },
      {
        framework: 'Trust Protocol',
        status: avgTrustScore >= 70 ? 'compliant' : 'warning',
        score: Math.round(avgTrustScore),
        lastAudit: new Date().toISOString(),
      },
    ];

    // Generate risk trends (last 7 days)
    const riskTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Calculate risk for this day
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayConvs = conversations.filter(
        conv => conv.lastActivity >= dayStart && conv.lastActivity <= dayEnd
      );

      const dayAvgTrust = dayConvs.length > 0
        ? dayConvs.reduce((sum, conv) => sum + ((conv.ethicalScore || 5) * 20), 0) / dayConvs.length
        : avgTrustScore;

      riskTrends.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(100 - dayAvgTrust),
      });
    }

    // Find recent risk events (conversations with low trust)
    const recentRiskEvents = conversations
      .filter(conv => (conv.ethicalScore || 5) < 3)
      .slice(0, 10)
      .map(conv => ({
        id: conv._id.toString(),
        title: `Low trust conversation`,
        severity: conv.ethicalScore < 2 ? 'critical' : 'error',
        description: `Conversation has low ethical score: ${((conv.ethicalScore || 0) * 20).toFixed(0)}/100`,
        category: 'trust_violation',
        resolved: false,
        created_at: conv.lastActivity.toISOString(),
      }));

    const riskData = {
      tenant: 'default',
      overallRiskScore,
      riskLevel,
      trustPrincipleScores: principleScores,
      complianceReports,
      riskTrends,
      recentRiskEvents,
      trustPrinciples: [
        { name: 'Consent Architecture', weight: 25, score: principleScores.consent, critical: true },
        { name: 'Inspection Mandate', weight: 20, score: principleScores.inspection, critical: false },
        { name: 'Continuous Validation', weight: 20, score: principleScores.validation, critical: false },
        { name: 'Ethical Override', weight: 15, score: principleScores.ethics, critical: true },
        { name: 'Right to Disconnect', weight: 10, score: principleScores.disconnect, critical: false },
        { name: 'Moral Recognition', weight: 10, score: principleScores.moral, critical: false },
      ],
    };

    logger.info('Risk metrics calculated', {
      userId,
      overallRiskScore,
      riskLevel,
      lowTrustMessages,
    });

    res.json({
      success: true,
      data: riskData,
    });
  } catch (error: any) {
    logger.error('Get risk metrics error', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk metrics',
      error: error.message,
    });
  }
});

export default router;
