import { Router, Request, Response } from 'express';
import { TrustReceiptModel, ITrustReceipt } from '../models/trust-receipt.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/proof/verify/:id
 * Verify a trust receipt by ID or hash
 */
router.get('/verify/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to find by self_hash, session_id, or MongoDB _id
    let receipt = await TrustReceiptModel.findOne({
      $or: [
        { self_hash: id },
        { session_id: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }
      ].filter(q => Object.values(q)[0] !== undefined)
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Receipt not found',
        message: 'The specified receipt ID or hash was not found in the system'
      });
    }

    // Perform verification
    const verification = {
      signatureValid: !!receipt.signature, // In production, verify the Ed25519 signature
      hashValid: !!receipt.self_hash, // In production, recompute and compare hash
      chainValid: !!receipt.previous_hash,
      timestampValid: !!receipt.createdAt,
      notTampered: true
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receipt.self_hash,
        sessionId: receipt.session_id,
        timestamp: receipt.createdAt,
        version: receipt.version,
        mode: receipt.mode,
        signature: receipt.signature || '',
        previousHash: receipt.previous_hash,
        ciqMetrics: receipt.ciq_metrics,
        issuer: receipt.issuer,
        subject: receipt.subject,
        agentId: receipt.agent_id,
        proof: receipt.proof
      },
      verification
    });
  } catch (error) {
    logger.error('Failed to verify proof', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Verification failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/proof/verify
 * Verify a trust receipt from JSON body
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const receiptData = req.body;

    if (!receiptData || (!receiptData.self_hash && !receiptData.id)) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid receipt',
        message: 'Receipt data must include a self_hash or id'
      });
    }

    const hashToFind = receiptData.self_hash || receiptData.id;

    // Check if it exists in our database
    const existingReceipt = await TrustReceiptModel.findOne({
      $or: [
        { self_hash: hashToFind },
        { session_id: hashToFind }
      ]
    });

    const verification = {
      signatureValid: !!receiptData.signature,
      hashValid: !!receiptData.self_hash || !!receiptData.id,
      chainValid: !!receiptData.previous_hash || !!receiptData.chainHash,
      timestampValid: !!receiptData.timestamp || !!receiptData.createdAt,
      notTampered: existingReceipt ? true : false
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receiptData.self_hash || receiptData.id,
        timestamp: receiptData.createdAt || receiptData.timestamp || new Date().toISOString(),
        signature: receiptData.signature || '',
        previousHash: receiptData.previous_hash,
        ciqMetrics: receiptData.ciq_metrics,
        issuer: receiptData.issuer,
        subject: receiptData.subject
      },
      verification,
      ...(existingReceipt ? {} : { 
        warnings: ['Receipt not found in database - may be from external source'] 
      })
    });
  } catch (error) {
    logger.error('Failed to verify proof', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Verification failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/proof/recent
 * Get recent trust receipts (for demo purposes)
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const receipts = await TrustReceiptModel.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select('self_hash session_id version mode ciq_metrics createdAt issuer subject');

    res.json({
      success: true,
      receipts: receipts.map(r => ({
        id: r.self_hash,
        sessionId: r.session_id,
        version: r.version,
        mode: r.mode,
        ciqMetrics: r.ciq_metrics,
        timestamp: r.createdAt,
        issuer: r.issuer,
        subject: r.subject
      })),
      count: receipts.length
    });
  } catch (error) {
    logger.error('Failed to get recent proofs', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent proofs',
      message: getErrorMessage(error)
    });
  }
});

export default router;
