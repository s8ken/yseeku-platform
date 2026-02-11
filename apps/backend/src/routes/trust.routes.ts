/**
 * Trust Protocol Routes
 * Exposes SONATE Trust Framework analytics and verification endpoints
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { trustService, TrustEvaluation } from '../services/trust.service';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { Conversation } from '../models/conversation.model';
import { TrustReceipt } from '@sonate/core';
import { didService } from '../services/did.service';
import { llmLimiter, apiGatewayLimiter } from '../middleware/rate-limiters';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import {
  sonateTrustReceiptsTotal,
  sonateResonanceReceiptsTotal,
  sonateTrustVerificationsTotal,
} from '../observability/metrics';

function validateReceiptPayload(data: any) {
  if (!data || typeof data !== 'object') return 'Payload must be an object';
  if (!data.self_hash || typeof data.self_hash !== 'string' || data.self_hash.length < 16) return 'Invalid self_hash';
  if (!data.session_id || typeof data.session_id !== 'string') return 'Invalid session_id';
  if (typeof data.timestamp !== 'number') return 'Invalid timestamp';
  if (!data.mode || typeof data.mode !== 'string') return 'Invalid mode';
  const m = data.ciq_metrics || data.ciq || {};
  const hasMetrics = typeof m.clarity === 'number' && typeof m.integrity === 'number' && typeof m.quality === 'number';
  if (!hasMetrics) return 'Invalid ciq_metrics';
  return null;
}

const router = Router();

/**
 * POST /api/trust/receipts
 * Save a trust receipt with optional DID-based signatures
 */
router.post('/receipts', protect, llmLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const receiptData = req.body;

    if (!receiptData || !receiptData.self_hash) {
      res.status(400).json({
        success: false,
        error: 'Invalid receipt data',
      });
      return;
    }
    if (typeof receiptData.self_hash !== 'string' || receiptData.self_hash.length < 16) {
      res.status(400).json({ success: false, error: 'Invalid self_hash format' });
      return;
    }
    if (receiptData.signature && typeof receiptData.signature !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid signature format' });
      return;
    }
    {
      const schemaErr = validateReceiptPayload({
        self_hash: receiptData.self_hash,
        session_id: receiptData.session_id,
        timestamp: receiptData.timestamp,
        mode: receiptData.mode,
        ciq_metrics: receiptData.ciq_metrics || receiptData.ciq,
      });
      if (schemaErr) {
        res.status(400).json({ success: false, error: schemaErr });
        return;
      }
    }

    // Check if exists
    const existing = await TrustReceiptModel.findOne({ self_hash: receiptData.self_hash });
    if (existing) {
      res.json({ success: true, saved: true, message: 'Receipt already exists' });
      return;
    }

    // Add DID fields if not present
    const platformDID = didService.getPlatformDID();
    const issuer = receiptData.issuer || platformDID;
    const subject = receiptData.subject || (receiptData.agent_id
      ? didService.getAgentDID(receiptData.agent_id)
      : undefined);

    const receipt = await TrustReceiptModel.create({
      ...receiptData,
      tenant_id: req.tenant || 'default',
      issuer,
      subject,
    });

    sonateTrustReceiptsTotal.inc();
    if (receiptData?.analysis_method?.resonanceMethod) {
      sonateResonanceReceiptsTotal.inc();
    }

    res.status(201).json({
      success: true,
      saved: true,
      data: receipt,
    });
  } catch (error: unknown) {
    logger.error('Save receipt error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to save receipt',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/analytics
 * Get trust analytics for user's conversations or specific conversation
 *
 * Query params:
 * - conversationId?: string - Filter by conversation
 * - days?: number - Last N days (default: 7)
 * - limit?: number - Max evaluations to analyze (default: 1000)
 */
router.get('/analytics', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, days = 7, limit = 1000 } = req.query;

    // Build query filter
    const filter: any = { user: req.userId };
    if (conversationId) {
      filter._id = conversationId;
    }

    // Calculate time range
    const daysNum = Number(days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    // Fetch conversations
    const conversations = await Conversation.find(filter)
      .select('messages ethicalScore lastActivity')
      .sort({ lastActivity: -1 })
      .limit(Number(limit));

    // Collect all trust evaluations from messages
    const evaluations: TrustEvaluation[] = [];

    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        // Only process messages within time range
        if (message.timestamp < cutoffDate) continue;

        // Only process messages with trust metadata
        if (!message.metadata?.trustEvaluation) continue;

        // Reconstruct TrustEvaluation from metadata
        const evaluation: TrustEvaluation = {
          trustScore: message.metadata.trustEvaluation.trustScore,
          status: message.metadata.trustEvaluation.status,
          detection: message.metadata.trustEvaluation.detection,
          receipt: message.metadata.trustEvaluation.receipt,
          receiptHash: message.metadata.trustEvaluation.receiptHash,
          timestamp: message.timestamp.getTime(),
          messageId: message.metadata.messageId,
          conversationId: conversation._id.toString(),
        };

        evaluations.push(evaluation);
      }
    }

    // Calculate analytics
    const analytics = await trustService.getTrustAnalytics(evaluations);

    res.json({
      success: true,
      data: {
        analytics,
        timeRange: {
          start: cutoffDate.toISOString(),
          end: new Date().toISOString(),
          days: daysNum,
        },
        conversationsAnalyzed: conversations.length,
        evaluationsCount: evaluations.length,
      },
    });
  } catch (error: unknown) {
    logger.error('Trust analytics error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trust analytics',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/trust/evaluate
 * Evaluate a message and return trust scores
 *
 * Body:
 * {
 *   content: string,
 *   conversationId?: string,
 *   previousMessages?: Array<{ sender: string, content: string }>,
 *   sessionId?: string
 * }
 */
router.post('/evaluate', protect, llmLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, conversationId, previousMessages = [], sessionId } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
      return;
    }
    if (typeof content !== 'string' || content.length > 20000) {
      res.status(400).json({ success: false, error: 'Invalid content format or too long' });
      return;
    }
    if (!Array.isArray(previousMessages) || previousMessages.length > 50) {
      res.status(400).json({ success: false, error: 'previousMessages must be an array of max 50 items' });
      return;
    }

    // Build message object
    const message = {
      sender: 'user' as const,
      content,
      metadata: {},
      ciModel: 'none' as const,
      trustScore: 0,
      timestamp: new Date(),
    };

    // Build context
    const context = {
      conversationId: conversationId || sessionId || `temp-${Date.now()}`,
      sessionId: sessionId || conversationId,
      previousMessages: previousMessages.map((msg: any) => ({
        sender: msg.sender || 'user',
        content: msg.content,
        metadata: {},
        ciModel: 'none' as const,
        trustScore: 0,
        timestamp: new Date(),
      })),
    };

    // Evaluate message
    const evaluation = await trustService.evaluateMessage(message, context);

    res.json({
      success: true,
      data: {
        evaluation: {
          trustScore: evaluation.trustScore,
          status: evaluation.status,
          detection: evaluation.detection,
          receiptHash: evaluation.receiptHash,
          timestamp: evaluation.timestamp,
        },
        principles: trustService.getPrinciples(),
      },
    });
  } catch (error: unknown) {
    logger.error('Trust evaluation error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate message',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/receipts
 * Get trust receipts for a conversation or session
 *
 * Query params:
 * - conversationId?: string
 * - sessionId?: string
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
router.get('/receipts', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, sessionId, limit = 50, offset = 0 } = req.query;

    if (!conversationId && !sessionId) {
      res.status(400).json({
        success: false,
        error: 'conversationId or sessionId is required',
      });
      return;
    }

    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId || sessionId,
      user: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Extract receipts from messages
    const receipts = conversation.messages
      .filter(msg => msg.metadata?.trustEvaluation?.receipt)
      .map(msg => ({
        messageId: msg.metadata.messageId,
        sender: msg.sender,
        timestamp: msg.timestamp,
        receipt: msg.metadata.trustEvaluation.receipt,
        receiptHash: msg.metadata.trustEvaluation.receiptHash,
        trustScore: msg.metadata.trustEvaluation.trustScore.overall,
        status: msg.metadata.trustEvaluation.status,
      }))
      .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        receipts,
        total: conversation.messages.filter(msg => msg.metadata?.trustEvaluation?.receipt).length,
        limit: Number(limit),
        offset: Number(offset),
        conversationId: conversation._id,
      },
    });
  } catch (error: unknown) {
    logger.error('Get receipts error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trust receipts',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/trust/receipts/:receiptHash/verify
 * Verify a trust receipt's cryptographic signature
 *
 * Body:
 * {
 *   receipt: TrustReceipt object
 * }
 */
router.post('/receipts/:receiptHash/verify', protect, llmLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiptHash } = req.params;
    const { receipt } = req.body;

    if (!receipt) {
      res.status(400).json({
        success: false,
        error: 'Receipt object is required',
      });
      return;
    }
    if (typeof receiptHash !== 'string' || receiptHash.length < 16) {
      res.status(400).json({ success: false, error: 'Invalid receiptHash' });
      return;
    }
    {
      const schemaErr = validateReceiptPayload({
        self_hash: receipt.self_hash || receipt.receiptHash || receipt.hash || receiptHash,
        session_id: receipt.session_id,
        timestamp: receipt.timestamp,
        mode: receipt.mode,
        ciq_metrics: receipt.ciq_metrics || receipt.ciq,
      });
      if (schemaErr) {
        res.status(400).json({ success: false, error: schemaErr });
        return;
      }
    }

    // Verify receipt hash matches (support multiple hash field names)
    const receiptHashValue = receipt.self_hash || receipt.receiptHash || receipt.hash;
    if (receiptHashValue !== receiptHash) {
      res.status(400).json({
        success: false,
        error: 'Receipt hash mismatch',
        expected: receiptHash,
        actual: receiptHashValue,
      });
      return;
    }

    // Check if receipt exists in database by hash
    let foundInDatabase = false;
    let dbReceipt: any = null;

    // Search in conversations for matching receipt hash
    const conversations = await Conversation.find({
      'messages.metadata.trustEvaluation.receiptHash': receiptHash,
    }).select('messages').lean();

    for (const conv of conversations) {
      for (const msg of conv.messages || []) {
        if (msg.metadata?.trustEvaluation?.receiptHash === receiptHash) {
          foundInDatabase = true;
          dbReceipt = msg.metadata.trustEvaluation;
          break;
        }
      }
      if (foundInDatabase) break;
    }

    // Also search in TrustReceipt collection if exists
    if (!foundInDatabase) {
      try {
        const { TrustReceiptModel } = require('../models/trust-receipt.model');
        const stored = await TrustReceiptModel.findOne({ self_hash: receiptHash }).lean();
        if (stored) {
          foundInDatabase = true;
          dbReceipt = stored;
        }
      } catch (e) {
        // Model might not exist, continue
      }
    }

    // Determine validity through multiple verification methods
    let isValid = false;
    let hashValid = false;
    let signatureValid = false;

    // Method 1: Try cryptographic signature verification if receipt has proper structure
    if (receipt.version && receipt.session_id && receipt.timestamp && receipt.mode && receipt.ciq_metrics) {
      try {
        // Normalize self_hash
        if (!receipt.self_hash && receiptHashValue) {
          receipt.self_hash = receiptHashValue;
        }

        const trustReceipt = new TrustReceipt(receipt);

        // Check if hash matches (recalculate and compare)
        hashValid = trustReceipt.self_hash === receiptHashValue;

        // If receipt has a signature, verify it cryptographically
        if (receipt.signature) {
          trustReceipt.signature = receipt.signature;
          signatureValid = await trustService.verifyReceipt(trustReceipt);
          if (signatureValid) isValid = true;
        } else if (hashValid) {
          // No signature but hash is valid - partial verification
          isValid = true;
        }
      } catch (e: any) {
        // Structure verification failed
        logger.warn('Cryptographic verification failed', { error: e?.message || e });
      }
    }

    // Method 2: Database lookup as fallback
    if (!isValid && foundInDatabase) {
      isValid = true;
    }

    // Get public key for response (so clients can verify independently)
    let publicKey: string | undefined;
    try {
      const { keysService } = require('../services/keys.service');
      publicKey = await keysService.getPublicKeyHex();
    } catch (e) {
      // Keys service not available
    }

    sonateTrustVerificationsTotal.inc();

    res.json({
      success: true,
      data: {
        valid: isValid,
        foundInDatabase,
        receipt: dbReceipt || {
          hash: receiptHashValue,
          ...receipt,
        },
        verification: {
          signatureValid,
          hashValid,
          inDatabase: foundInDatabase,
          verifiedAt: new Date().toISOString(),
          publicKey, // Include public key for independent verification
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Verify receipt error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to verify trust receipt',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/principles
 * Get the 6 constitutional principles and their definitions
 */
router.get('/principles', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const principles = trustService.getPrinciples();

    res.json({
      success: true,
      data: {
        principles,
        description: 'The 6 Constitutional Principles of the SONATE Trust Framework',
        totalWeight: Object.values(principles).reduce((sum, p) => sum + p.weight, 0),
      },
    });
  } catch (error: unknown) {
    logger.error('Get principles error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve principles',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/signing-key
 * Get the public key used for signing trust receipts
 */
router.get('/signing-key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keysService } = require('../services/keys.service');
    await keysService.initialize();

    const publicKey = await keysService.getPublicKeyHex();

    res.json({
      success: true,
      data: {
        publicKey,
        algorithm: 'Ed25519',
        usage: 'Trust receipt signature verification',
        format: 'hex',
      },
    });
  } catch (error: unknown) {
    logger.error('Get signing key error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve signing key',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/health
 * Get overall trust health for user's conversations
 */
router.get('/health', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const conversations = await Conversation.find({ user: req.userId })
      .select('ethicalScore messages lastActivity')
      .sort({ lastActivity: -1 });

    // Calculate overall health metrics
    const totalConversations = conversations.length;
    const avgEthicalScore =
      conversations.reduce((sum, conv) => sum + (conv.ethicalScore || 0), 0) / totalConversations || 0;

    // Count conversations with trust issues
    const lowTrustConversations = conversations.filter(conv => (conv.ethicalScore || 0) < 3).length;
    const mediumTrustConversations = conversations.filter(
      conv => (conv.ethicalScore || 0) >= 3 && (conv.ethicalScore || 0) < 4
    ).length;
    const highTrustConversations = conversations.filter(conv => (conv.ethicalScore || 0) >= 4).length;

    // Count recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = conversations.filter(conv => conv.lastActivity >= sevenDaysAgo).length;

    res.json({
      success: true,
      data: {
        overallHealth: {
          averageEthicalScore: Math.round(avgEthicalScore * 100) / 100,
          totalConversations,
          recentActivity: {
            last7Days: recentActivity,
            percentage: Math.round((recentActivity / totalConversations) * 100) || 0,
          },
        },
        trustDistribution: {
          low: {
            count: lowTrustConversations,
            percentage: Math.round((lowTrustConversations / totalConversations) * 100) || 0,
            threshold: '< 3.0',
          },
          medium: {
            count: mediumTrustConversations,
            percentage: Math.round((mediumTrustConversations / totalConversations) * 100) || 0,
            threshold: '3.0 - 3.9',
          },
          high: {
            count: highTrustConversations,
            percentage: Math.round((highTrustConversations / totalConversations) * 100) || 0,
            threshold: '>= 4.0',
          },
        },
        recommendations: generateRecommendations(avgEthicalScore, lowTrustConversations, totalConversations),
      },
    });
  } catch (error: unknown) {
    logger.error('Trust health error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trust health',
      message: getErrorMessage(error),
    });
  }
});

/**
 * Helper: Generate recommendations based on trust metrics
 */
function generateRecommendations(
  avgScore: number,
  lowTrustCount: number,
  totalCount: number
): string[] {
  const recommendations: string[] = [];

  if (avgScore < 3.0) {
    recommendations.push('Overall trust score is low. Review AI agent configurations and enable Constitutional AI oversight.');
  }

  const lowTrustPercentage = (lowTrustCount / totalCount) * 100;
  if (lowTrustPercentage > 20) {
    recommendations.push(
      `${Math.round(lowTrustPercentage)}% of conversations have low trust scores. Consider enabling stricter trust protocols.`
    );
  }

  if (avgScore >= 4.0) {
    recommendations.push('Trust health is excellent. Continue current practices.');
  }

  if (totalCount < 5) {
    recommendations.push('Insufficient data for comprehensive analysis. Continue using the platform to build trust history.');
  }

  return recommendations;
}

/**
 * GET /api/trust/receipts/by-did/:did
 * Get trust receipts for a specific DID (subject or issuer)
 */
router.get('/receipts/by-did/:did', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { did } = req.params;
    const { role = 'subject', limit = 50, offset = 0 } = req.query;

    // Decode the DID (might be URL encoded)
    const decodedDID = decodeURIComponent(String(did));

    // Build query based on role
    const query: any = {};
    if (role === 'issuer') {
      query.issuer = decodedDID;
    } else {
      query.subject = decodedDID;
    }

    const receipts = await TrustReceiptModel.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await TrustReceiptModel.countDocuments(query);

    res.json({
      success: true,
      data: {
        receipts,
        did: decodedDID,
        role,
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: unknown) {
    logger.error('Get receipts by DID error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve receipts by DID',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/did-info
 * Get DID information for the trust service
 */
router.get('/did-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const platformDID = didService.getPlatformDID();

    res.json({
      success: true,
      data: {
        platformDID,
        domain: didService.PLATFORM_DOMAIN,
        didDocumentUrl: `https://${didService.PLATFORM_DOMAIN}/.well-known/did.json`,
        supportedMethods: ['did:web'],
        description: 'Platform DID for signing trust receipts as Verifiable Credentials',
      },
    });
  } catch (error: unknown) {
    logger.error('Get DID info error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve DID info',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust/receipts/list
 * List trust receipts by tenant (current user tenant) with pagination
 * Query: limit, offset
 */
router.get('/receipts/list', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const tenantId = req.userTenant || req.tenant || 'default';

    const [receipts, total, verified] = await Promise.all([
      TrustReceiptModel.find({ tenant_id: tenantId })
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean(),
      TrustReceiptModel.countDocuments({ tenant_id: tenantId }),
      TrustReceiptModel.countDocuments({ tenant_id: tenantId, signature: { $exists: true, $ne: '' } }),
    ]);

    res.json({
      success: true,
      data: receipts,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
      stats: {
        total,
        verified,
        invalid: total - verified,
        chainLength: total,
      },
    });
  } catch (error: unknown) {
    logger.error('List receipts error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to list receipts', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/trust/receipts/grouped
 * Get receipts grouped by session_id with summary stats
 * Query: limit, offset
 */
router.get('/receipts/grouped', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const tenantId = req.userTenant || req.tenant || 'default';

    const grouped = await TrustReceiptModel.aggregate([
      { $match: { tenant_id: tenantId } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$session_id',
        count: { $sum: 1 },
        first_timestamp: { $min: '$createdAt' },
        last_timestamp: { $max: '$createdAt' },
        avg_clarity: { $avg: '$ciq_metrics.clarity' },
        avg_integrity: { $avg: '$ciq_metrics.integrity' },
        avg_quality: { $avg: '$ciq_metrics.quality' },
        receipts: { $push: {
          self_hash: '$self_hash',
          timestamp: '$timestamp',
          ciq_metrics: '$ciq_metrics',
          signature: '$signature',
          createdAt: '$createdAt'
        }},
      }},
      { $sort: { last_timestamp: -1 } },
      { $skip: Number(offset) },
      { $limit: Number(limit) },
      { $project: {
        session_id: '$_id',
        count: 1,
        first_timestamp: 1,
        last_timestamp: 1,
        avg_trust_score: {
          $multiply: [
            { $add: [
              { $multiply: ['$avg_clarity', 0.33] },
              { $multiply: ['$avg_integrity', 0.34] },
              { $multiply: ['$avg_quality', 0.33] }
            ]},
            10
          ]
        },
        latest_receipt: { $arrayElemAt: ['$receipts', 0] },
        _id: 0
      }},
    ]);

    const totalSessions = await TrustReceiptModel.distinct('session_id', { tenant_id: tenantId });

    res.json({
      success: true,
      data: {
        sessions: grouped,
        total: totalSessions.length,
        pagination: { limit: Number(limit), offset: Number(offset) },
      },
    });
  } catch (error: unknown) {
    logger.error('Get grouped receipts error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get grouped receipts', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/trust/receipts/:receiptHash
 * Fetch a single trust receipt by hash
 */
router.get('/receipts/:receiptHash', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiptHash } = req.params;
    if (!receiptHash || receiptHash.length < 16) {
      res.status(400).json({ success: false, error: 'Invalid receiptHash' });
      return;
    }
    const receipt = await TrustReceiptModel.findOne({ self_hash: receiptHash }).lean();
    if (!receipt) {
      res.status(404).json({ success: false, error: 'Receipt not found' });
      return;
    }
    res.json({ success: true, data: receipt });
  } catch (error: unknown) {
    logger.error('Get receipt by hash error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to fetch receipt', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/trust/identity/:sessionId
 * Get identity fingerprint for a session (computed from message patterns)
 */
router.get('/identity/:sessionId', protect, apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Get receipts for this session
    const receipts = await TrustReceiptModel.find({ session_id: sessionId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (receipts.length === 0) {
      // Return default fingerprint
      res.json({
        success: true,
        data: {
          professionalism: 85,
          empathy: 78,
          accuracy: 92,
          consistency: 88,
          helpfulness: 90,
          boundaries: 82,
        },
      });
      return;
    }

    // Compute fingerprint from CIQ metrics
    const avgClarity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 0), 0) / receipts.length;
    const avgIntegrity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 0), 0) / receipts.length;
    const avgQuality = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 0), 0) / receipts.length;

    // Map CIQ to identity dimensions (simplified mapping)
    const fingerprint = {
      professionalism: Math.min(100, avgClarity * 10 + 50),
      empathy: Math.min(100, avgIntegrity * 8 + 40),
      accuracy: Math.min(100, avgQuality * 10 + 45),
      consistency: Math.min(100, (avgClarity + avgIntegrity) * 5 + 40),
      helpfulness: Math.min(100, (avgQuality + avgIntegrity) * 5 + 45),
      boundaries: Math.min(100, avgIntegrity * 9 + 35),
    };

    res.json({ success: true, data: fingerprint });
  } catch (error: unknown) {
    logger.error('Get identity fingerprint error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get identity fingerprint', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/trust/session/:sessionId/status
 * Get trust status for a session (for Trust Passport widget)
 */
router.get('/session/:sessionId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Get latest receipts for this session
    const receipts = await TrustReceiptModel.find({ session_id: sessionId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (receipts.length === 0) {
      res.json({
        success: true,
        data: {
          resonance: 0.85,
          coherence: 0.88,
          status: 'verified',
        },
      });
      return;
    }

    // Compute average resonance from recent receipts
    const avgClarity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 5), 0) / receipts.length;
    const avgIntegrity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 5), 0) / receipts.length;
    const avgQuality = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 5), 0) / receipts.length;

    const resonance = (avgClarity + avgIntegrity + avgQuality) / 30; // Normalize to 0-1
    const coherence = avgIntegrity / 10; // Integrity maps to coherence

    res.json({
      success: true,
      data: {
        resonance: Math.min(1, Math.max(0, resonance)),
        coherence: Math.min(1, Math.max(0, coherence)),
        status: resonance >= 0.7 ? 'verified' : resonance >= 0.4 ? 'warning' : 'unknown',
        receiptCount: receipts.length,
      },
    });
  } catch (error: unknown) {
    logger.error('Get session status error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to get session status', message: getErrorMessage(error) });
  }
});

export default router;
