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

    // Try to find by ID first, then by self_hash or session_id
    const receipt = await TrustReceiptModel.findOne({
      $or: [
        { _id: id },
        { self_hash: id },
        { session_id: id }
      ]
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
      signatureValid: !!receipt.signature,
      hashValid: !!receipt.self_hash,
      chainValid: !!receipt.previous_hash,
      timestampValid: !!receipt.timestamp,
      notTampered: true
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receipt._id,
        selfHash: receipt.self_hash,
        sessionId: receipt.session_id,
        timestamp: receipt.timestamp,
        version: receipt.version,
        mode: receipt.mode,
        signature: receipt.signature || '',
        previousHash: receipt.previous_hash,
        ciqMetrics: receipt.ciq_metrics,
        issuer: receipt.issuer,
        subject: receipt.subject,
        proof: receipt.proof,
        createdAt: receipt.createdAt
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

    if (!receiptData || (!receiptData.id && !receiptData.self_hash)) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid receipt',
        message: 'Receipt data must include an id or self_hash'
      });
    }

    // Check if it exists in our database
    const existingReceipt = await TrustReceiptModel.findOne({
      $or: [
        { self_hash: receiptData.self_hash || receiptData.id },
        { session_id: receiptData.session_id }
      ].filter(Boolean)
    });

    const verification = {
      signatureValid: !!receiptData.signature,
      hashValid: !!receiptData.self_hash,
      chainValid: !!receiptData.previous_hash,
      timestampValid: !!receiptData.timestamp,
      notTampered: !!existingReceipt
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receiptData.id || receiptData.self_hash,
        selfHash: receiptData.self_hash,
        sessionId: receiptData.session_id,
        timestamp: receiptData.timestamp || Date.now(),
        version: receiptData.version || '1.0.0',
        mode: receiptData.mode || 'constitutional',
        signature: receiptData.signature || '',
        previousHash: receiptData.previous_hash,
        ciqMetrics: receiptData.ciq_metrics,
        issuer: receiptData.issuer,
        subject: receiptData.subject
      },
      verification,
      ...(existingReceipt ? {} : {
        errors: ['Receipt not found in database - may be from external source']
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

export default router;
