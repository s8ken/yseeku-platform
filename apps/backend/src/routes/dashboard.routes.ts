/**
 * Dashboard Routes
 * Aggregated KPI metrics for dashboard overview
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { AlertModel } from '../models/alert.model';
import { Experiment } from '../models/experiment.model';
import { bedauService } from '../services/bedau.service';
import { cacheGet, cacheSet } from '../services/cache.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/dashboard/kpis
 * Get aggregated KPI metrics for dashboard
 *
 * Uses X-Tenant-ID header for multi-tenant support:
 * - demo-tenant: Returns pre-seeded demo data (handled by /api/demo/kpis)
 * - live-tenant: Returns blank slate data for new user experience
 * - other: Returns real user data from database
 */
router.get('/kpis', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';
    
    // OPTIMIZATION: Check cache first before expensive database queries
    // Cache is tenant-specific and per-user for security
    const cacheKey = `kpis:${tenantId}:${userId}`;
    const cachedKPIs = await cacheGet<any>(cacheKey);
    if (cachedKPIs) {
      logger.debug('KPIs cache hit', { cacheKey });
      res.json({
        success: true,
        data: cachedKPIs,
        _cached: true, // Indicate this came from cache
      });
      return;
    }

    const now = new Date();
    const nowTimestamp = now.getTime();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAgoTimestamp = oneDayAgo.getTime();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const twoDaysAgoTimestamp = twoDaysAgo.getTime();

    // For live-tenant, query REAL data from Trust Receipts (populated by chat interactions)
    // This makes live mode a production-ready experience that updates as users interact
    if (tenantId === 'live-tenant') {
      logger.info('[LIVE MODE] Fetching trust receipts for live-tenant', { userId, tenantId });
      
      // OPTIMIZATION: Use MongoDB aggregation pipeline instead of fetching all docs
      // This calculates metrics server-side, is much faster for large datasets
      const aggregationResult = await TrustReceiptModel.aggregate<any>([
        {
          $match: { tenant_id: 'live-tenant' }
        },
        {
          $facet: {
            all: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgClarity: { $avg: '$ciq_metrics.clarity' },
                  avgIntegrity: { $avg: '$ciq_metrics.integrity' },
                  avgQuality: { $avg: '$ciq_metrics.quality' },
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $gte: [
                            { $avg: ['$ciq_metrics.clarity', '$ciq_metrics.integrity', '$ciq_metrics.quality'] },
                            0.6  // CIQ values are 0-1 scale; 0.6 = 6/10 pass threshold
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  }
                }
              }
            ],
            recent: [
              {
                $match: {
                  timestamp: { $gte: oneDayAgoTimestamp }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgClarity: { $avg: '$ciq_metrics.clarity' },
                  avgIntegrity: { $avg: '$ciq_metrics.integrity' },
                  avgQuality: { $avg: '$ciq_metrics.quality' },
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $gte: [
                            { $avg: ['$ciq_metrics.clarity', '$ciq_metrics.integrity', '$ciq_metrics.quality'] },
                            0.6  // CIQ values are 0-1 scale
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  }
                }
              }
            ],
            previous: [
              {
                $match: {
                  timestamp: { $gte: twoDaysAgoTimestamp, $lt: oneDayAgoTimestamp }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  avgClarity: { $avg: '$ciq_metrics.clarity' },
                  avgIntegrity: { $avg: '$ciq_metrics.integrity' },
                  avgQuality: { $avg: '$ciq_metrics.quality' },
                  passCount: {
                    $sum: {
                      $cond: [
                        {
                          $gte: [
                            { $avg: ['$ciq_metrics.clarity', '$ciq_metrics.integrity', '$ciq_metrics.quality'] },
                            0.6  // CIQ values are 0-1 scale
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      ]);

      // Extract aggregated metrics
      const allData = aggregationResult[0].all[0] || { count: 0, avgClarity: 0, avgIntegrity: 0, avgQuality: 0, passCount: 0 };
      const recentData = aggregationResult[0].recent[0] || { count: 0, avgClarity: 0, avgIntegrity: 0, avgQuality: 0, passCount: 0 };
      const previousData = aggregationResult[0].previous[0] || { count: 0, avgClarity: 0, avgIntegrity: 0, avgQuality: 0, passCount: 0 };

      logger.info('[LIVE MODE] Trust receipts aggregated', { 
        recentCount: recentData.count,
        previousCount: previousData.count,
        totalCount: allData.count,
      });

      // Fetch related metrics
      const [activeAgentsCount, alertsCount, experimentsCount] = await Promise.all([
        Agent.countDocuments({ user: userId, lastActive: { $gte: oneDayAgo } }),
        AlertModel.countDocuments({ tenantId: 'live-tenant', status: 'active' }),
        Experiment.countDocuments({ tenantId: 'live-tenant', status: 'running' }),
      ]);

      // Convert aggregated metrics to KPI format
      const calculateMetricsFromAggregation = (data: any) => {
        if (data.count === 0) {
          return {
            trustScore: 0,
            count: 0,
            complianceRate: 0,
            principleScores: {
              transparency: 0,
              fairness: 0,
              privacy: 0,
              safety: 0,
              accountability: 0,
            },
          };
        }

        // CIQ values are 0-1 scale, convert to 0-100 scale for trustScore
        const avgScore = ((data.avgClarity || 0) + (data.avgIntegrity || 0) + (data.avgQuality || 0)) / 3;
        const complianceRate = Math.round((data.passCount / data.count) * 100 * 10) / 10;

        return {
          trustScore: Math.round(avgScore * 100 * 10) / 10, // Convert 0-1 to 0-100 scale with 1 decimal precision
          count: data.count,
          complianceRate,
          principleScores: {
            transparency: Math.round((data.avgClarity || 0) * 100 * 10) / 10,
            fairness: Math.round((data.avgIntegrity || 0) * 100 * 10) / 10,
            privacy: Math.round((data.avgQuality || 0) * 100 * 10) / 10,
            safety: Math.round((data.avgIntegrity || 0) * 100 * 10) / 10,
            accountability: Math.round((data.avgClarity || 0) * 100 * 10) / 10,
          },
        };
      };

      const currentMetrics = calculateMetricsFromAggregation(recentData);
      const previousMetrics = calculateMetricsFromAggregation(previousData);
      const allMetrics = calculateMetricsFromAggregation(allData);

      // Calculate trends
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { change: 0, direction: 'stable' };
        const change = Math.round(((current - previous) / previous) * 100 * 10) / 10;
        const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
        return { change: Math.abs(change), direction };
      };

      const liveKPIs = {
        tenant: 'live-tenant',
        timestamp: now.toISOString(),
        trustScore: allMetrics.trustScore,
        principleScores: allMetrics.principleScores,
        totalInteractions: allData.count,
        activeAgents: activeAgentsCount,
        complianceRate: allMetrics.complianceRate,
        riskScore: allMetrics.trustScore > 0 ? Math.round((100 - allMetrics.trustScore) / 10 * 10) / 10 : 0, // Convert risk to 0-10 scale with 1 decimal
        alertsCount,
        experimentsRunning: experimentsCount,
        orchestratorsActive: 0,
        // v2.0.1: Only 3 validated dimensions
        sonateDimensions: {
          trustProtocol: allMetrics.count === 0 ? 'N/A' : 
            allMetrics.complianceRate >= 80 ? 'PASS' : 
            allMetrics.complianceRate >= 60 ? 'PARTIAL' : 'FAIL',
          ethicalAlignment: Math.round((allMetrics.trustScore / 20) * 10) / 10, // Convert 0-100 to 0-5 scale
          resonanceQuality: allMetrics.count === 0 ? 'NONE' :
            allMetrics.trustScore >= 85 ? 'ADVANCED' : 
            allMetrics.trustScore >= 70 ? 'STRONG' : 'BASIC', // trustScore on 0-100 scale
          // Deprecated fields - kept for backward compatibility, always return 0
          realityIndex: 0,
          canvasParity: 0,
        },
        trends: {
          trustScore: calculateTrend(currentMetrics.trustScore, previousMetrics.trustScore),
          interactions: calculateTrend(currentMetrics.count, previousMetrics.count),
          compliance: calculateTrend(currentMetrics.complianceRate, previousMetrics.complianceRate),
          risk: { change: 0, direction: 'stable' },
        },
        bedau: {
          index: 0,
          type: 'LINEAR',
          confidenceInterval: [0, 0],
          kolmogorovComplexity: 0,
        },
      };

      logger.info('Live tenant KPIs calculated from receipts', { 
        userId, 
        tenantId, 
        receiptCount: allData.count,
        trustScore: liveKPIs.trustScore,
      });

      // Cache the KPI response for 15 seconds (short TTL for responsive updates)
      await cacheSet(cacheKey, liveKPIs, 15);

      res.json({
        success: true,
        data: liveKPIs,
      });
      return;
    }

    // For other tenants (including default), use conversation-based metrics
    // Time ranges for current and previous periods

    // Fetch user's conversations
    // OPTIMIZATION: Use aggregation for conversation metrics calculation
    const conversationAggregation = await Conversation.aggregate<any>([
      { $match: { user: userId } },
      {
        $facet: {
          recent: [
            { $match: { lastActivity: { $gte: oneDayAgo } } },
            { $group: {
              _id: null,
              count: { $sum: 1 },
              avgTrust: { $avg: '$ethicalScore' },
              totalMessages: { $sum: { $size: '$messages' } }
            }}
          ],
          previous: [
            { $match: { lastActivity: { $gte: twoDaysAgo, $lt: oneDayAgo } } },
            { $group: {
              _id: null,
              count: { $sum: 1 },
              avgTrust: { $avg: '$ethicalScore' },
              totalMessages: { $sum: { $size: '$messages' } }
            }}
          ],
          all: [
            { $group: {
              _id: null,
              count: { $sum: 1 },
              avgTrust: { $avg: '$ethicalScore' },
              totalMessages: { $sum: { $size: '$messages' } }
            }}
          ]
        }
      }
    ]);

    const recentConvData = conversationAggregation[0].recent[0] || { count: 0, avgTrust: 85, totalMessages: 0 };
    const previousConvData = conversationAggregation[0].previous[0] || { count: 0, avgTrust: 85, totalMessages: 0 };
    const allConvData = conversationAggregation[0].all[0] || { count: 0, avgTrust: 85, totalMessages: 0 };

    // Fetch agents and Bedau metrics
    const [activeAgentsCount, allAgentsCount, bedauMetrics] = await Promise.all([
      Agent.countDocuments({
        user: userId,
        lastActive: { $gte: oneDayAgo },
      }),
      Agent.countDocuments({ user: userId }),
      bedauService.getMetrics('default'), // Using 'default' tenant for now
    ]);

    // Convert aggregated conversation metrics to KPI format
    const calculateTrustMetricsFromAggregation = (data: any) => {
      const avgTrustNormalized = data.avgTrust || 4.25; // Default to 85/100 (4.25 on 0-5 scale)
      const trustScore = avgTrustNormalized * 20; // Convert 0-5 to 0-100 scale
      const complianceRate = avgTrustNormalized * 20; // Convert to percentage
      
      return {
        trustScore: Math.round(trustScore * 10) / 10,
        totalMessages: data.totalMessages || 0,
        complianceRate: Math.round(complianceRate * 10) / 10,
        principleScores: {
          transparency: Math.round(avgTrustNormalized * 20 * 10) / 10, // Convert 0-5 to 0-100
          fairness: Math.round(avgTrustNormalized * 20 * 10) / 10,
          privacy: Math.round(avgTrustNormalized * 20 * 10) / 10,
          safety: Math.round(avgTrustNormalized * 20 * 10) / 10,
          accountability: Math.round(avgTrustNormalized * 20 * 10) / 10,
        },
      };
    };

    // Calculate current and previous metrics
    const currentMetrics = calculateTrustMetricsFromAggregation(recentConvData);
    const previousMetrics = calculateTrustMetricsFromAggregation(previousConvData);
    const allMetrics = calculateTrustMetricsFromAggregation(allConvData);

    // Calculate SONATE dimensions from recent data
    // v2.0.1: Only 3 validated dimensions
    const sonateDimensions = {
      trustProtocol: allMetrics.complianceRate >= 80 ? 'PASS' : allMetrics.complianceRate >= 60 ? 'PARTIAL' : 'FAIL',
      ethicalAlignment: Math.round((allMetrics.trustScore / 20) * 10) / 10, // Convert 0-100 to 0-5 scale
      resonanceQuality: allMetrics.trustScore >= 85 ? 'ADVANCED' : allMetrics.trustScore >= 70 ? 'STRONG' : 'BASIC', // trustScore on 0-100 scale
      // Deprecated fields - kept for backward compatibility, always return 0
      realityIndex: 0,
      canvasParity: 0,
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

    // Calculate alerts based on trust metrics (lower trust = more alerts)
    const alertsCount = allMetrics.trustScore < 60 ? Math.ceil((100 - allMetrics.trustScore) / 10) : 0;

    // Calculate risk score (inverse of trust score)
    const riskScore = Math.round((100 - allMetrics.trustScore) / 10);

    // Build response
    const kpiData = {
      tenant: 'default',
      timestamp: now.toISOString(),
      trustScore: allMetrics.trustScore,
      principleScores: allMetrics.principleScores,
      totalInteractions: allMetrics.totalMessages,
      activeAgents: activeAgentsCount,
      complianceRate: allMetrics.complianceRate,
      riskScore,
      alertsCount,
      experimentsRunning: 0, // Lab experiments not yet implemented
      orchestratorsActive: 0, // Orchestrators not yet implemented
      sonateDimensions,
      trends,
      bedau: {
        index: bedauMetrics.bedau_index,
        type: bedauMetrics.emergence_type,
        confidenceInterval: bedauMetrics.confidence_interval,
        kolmogorovComplexity: bedauMetrics.kolmogorov_complexity,
      },
    };

    logger.info('KPI metrics calculated', {
      userId,
      trustScore: kpiData.trustScore,
      activeAgents: activeAgentsCount,
      totalInteractions: kpiData.totalInteractions,
    });

    // Cache the KPI response for 120 seconds
    await cacheSet(cacheKey, kpiData, 120);

    res.json({
      success: true,
      data: kpiData,
    });
  } catch (error: unknown) {
    logger.error('Get KPIs error', {
      error: getErrorMessage(error),
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPI metrics',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/dashboard/policy-status
 * Get simple policy compliance status
 */
router.get('/policy-status', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';
    
    // Query real data for any tenant (including live-tenant)
    // If no violations exist, the result is naturally compliant
    
    // Quick check on recent conversations for any critical violations
    const recentViolations = await Conversation.find({
      user: userId,
      ethicalScore: { $lt: 2 } // Very low score
    }).limit(5).select('title ethicalScore');

    const overallPass = recentViolations.length === 0;
    
    res.json({
      overallPass,
      violations: recentViolations.map(v => v.title)
    });
  } catch (error: unknown) {
    logger.error('Get policy status error', { error: getErrorMessage(error) });
    res.status(500).json({ overallPass: false, violations: ['Error checking policy'] });
  }
});

/**
 * GET /api/dashboard/risk
 * Get risk assessment metrics and compliance reports
 *
 * Uses tenant for multi-tenant support - queries real data for all tenants.
 * If no data exists for a tenant, the result naturally shows no risk.
 */
router.get('/risk', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';

    // Fetch user's conversations for risk analysis
    const conversations = await Conversation.find({ user: userId })
      .select('messages ethicalScore lastActivity createdAt')
      .sort({ lastActivity: -1 });

    // If no conversations exist (including for live-tenant), return no-risk state
    if (conversations.length === 0) {
      res.json({
        success: true,
        data: {
          tenant: tenantId,
          timestamp: new Date().toISOString(),
          trustScore: 0,
          complianceScore: 0,
          overallRisk: 'none',
          principleScores: {
            consent: 0,
            inspection: 0,
            validation: 0,
            ethics: 0,
            disconnect: 0,
            moral: 0,
          },
          riskFactors: [],
          recentViolations: [],
          complianceReport: {
            status: 'no_data',
            checks: [],
          },
        },
      });
      return;
    }

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

        // Map SONATE principles to risk categories
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
  } catch (error: unknown) {
    logger.error('Get risk metrics error', {
      error: getErrorMessage(error),
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk metrics',
      error: getErrorMessage(error),
    });
  }
});

export default router;
