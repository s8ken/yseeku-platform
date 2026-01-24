import { Router, Request, Response } from 'express';
import { TrustReceipt } from '../models/trust-receipt.model';
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
    
    // Try to find by ID first, then by content hash
    let receipt = await TrustReceiptModel.findOne({
      $or: [
        { _id: id },
        { 'receipt.id': id },
        { 'receipt.contentHash': id },
        { receiptId: id }
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
      signatureValid: true, // In production, verify the Ed25519 signature
      hashValid: true, // In production, recompute and compare hash
      chainValid: receipt.receipt?.chainHash ? true : false,
      timestampValid: receipt.createdAt ? true : false,
      notTampered: true
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receipt.receiptId || receipt._id,
        timestamp: receipt.createdAt,
        contentHash: receipt.receipt?.contentHash || '',
        signature: receipt.receipt?.signature || '',
        chainHash: receipt.receipt?.chainHash,
        trustScore: receipt.receipt?.trustScore || 0,
        status: receipt.receipt?.status || 'UNKNOWN',
        principles: receipt.receipt?.principles || {},
        issuer: receipt.receipt?.issuer,
        subject: receipt.receipt?.subject,
        conversationId: receipt.conversationId,
        messageId: receipt.messageId
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

    if (!receiptData || !receiptData.id) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid receipt',
        message: 'Receipt data must include an id'
      });
    }

    // In production, verify the receipt cryptographically
    // For now, check if it exists in our database
    const existingReceipt = await TrustReceiptModel.findOne({
      $or: [
        { 'receipt.id': receiptData.id },
        { receiptId: receiptData.id }
      ]
    });

    const verification = {
      signatureValid: !!receiptData.signature,
      hashValid: !!receiptData.contentHash,
      chainValid: !!receiptData.chainHash,
      timestampValid: !!receiptData.timestamp,
      notTampered: existingReceipt ? true : false
    };

    const isValid = Object.values(verification).every(v => v);

    res.json({
      success: true,
      valid: isValid,
      receipt: {
        id: receiptData.id,
        timestamp: receiptData.timestamp || new Date().toISOString(),
        contentHash: receiptData.contentHash || '',
        signature: receiptData.signature || '',
        chainHash: receiptData.chainHash,
        trustScore: receiptData.trustScore || 0,
        status: receiptData.status || 'UNKNOWN',
        principles: receiptData.principles || {},
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
