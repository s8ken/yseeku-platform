/**
 * Verifiable Credentials API Routes
 * 
 * W3C Verifiable Credentials endpoints:
 * - Create VC from trust receipt
 * - Create Verifiable Presentation
 * - Verify credentials
 * - Export/Import as JWT
 */

import { Router, Request, Response } from 'express';
import { verifiableCredentialsService } from '../services/verifiable-credentials.service';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { protect } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * POST /api/credentials/create
 * Create a Verifiable Credential from a trust receipt
 */
router.post('/create', protect, async (req: Request, res: Response) => {
  try {
    const { receiptId, expirationDays, includeStatus } = req.body;
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';

    if (!receiptId) {
      res.status(400).json({
        success: false,
        error: 'receiptId is required',
      });
      return;
    }

    // Find the receipt
    const receipt = await TrustReceiptModel.findOne({
      $or: [
        { _id: receiptId },
        { self_hash: receiptId },
      ],
      tenant_id: tenantId,
    }).lean();

    if (!receipt) {
      res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
      return;
    }

    const credential = await verifiableCredentialsService.createCredential(receipt, {
      expirationDays,
      includeStatus,
    });

    res.status(201).json({
      success: true,
      data: {
        credential,
        format: 'json-ld',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create credential', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create credential',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/credentials/create-from-receipt
 * Create VC directly from receipt data (no DB lookup)
 */
router.post('/create-from-receipt', protect, async (req: Request, res: Response) => {
  try {
    const { receipt, expirationDays, includeStatus } = req.body;

    if (!receipt) {
      res.status(400).json({
        success: false,
        error: 'receipt data is required',
      });
      return;
    }

    const credential = await verifiableCredentialsService.createCredential(receipt, {
      expirationDays,
      includeStatus,
    });

    res.status(201).json({
      success: true,
      data: {
        credential,
        format: 'json-ld',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create credential from receipt', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create credential',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/credentials/presentation
 * Create a Verifiable Presentation from multiple credentials
 */
router.post('/presentation', protect, async (req: Request, res: Response) => {
  try {
    const { credentials, holder, challenge, domain } = req.body;

    if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
      res.status(400).json({
        success: false,
        error: 'credentials array is required',
      });
      return;
    }

    if (!holder) {
      res.status(400).json({
        success: false,
        error: 'holder DID is required',
      });
      return;
    }

    const presentation = await verifiableCredentialsService.createPresentation(
      credentials,
      holder,
      { challenge, domain }
    );

    res.status(201).json({
      success: true,
      data: {
        presentation,
        format: 'json-ld',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create presentation', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create presentation',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/credentials/verify
 * Verify a Verifiable Credential
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        error: 'credential is required',
      });
      return;
    }

    const result = await verifiableCredentialsService.verifyCredential(credential);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to verify credential', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to verify credential',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/credentials/export-jwt
 * Export a credential as JWT
 */
router.post('/export-jwt', protect, async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        error: 'credential is required',
      });
      return;
    }

    const jwt = await verifiableCredentialsService.exportAsJWT(credential);

    res.json({
      success: true,
      data: {
        jwt,
        format: 'jwt',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to export credential as JWT', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to export credential',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/credentials/import-jwt
 * Import a credential from JWT
 */
router.post('/import-jwt', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      res.status(400).json({
        success: false,
        error: 'jwt is required',
      });
      return;
    }

    const credential = await verifiableCredentialsService.importFromJWT(jwt);

    res.json({
      success: true,
      data: {
        credential,
        format: 'json-ld',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to import credential from JWT', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to import credential',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/credentials/context
 * Get the SONATE trust context document
 */
router.get('/context', (req: Request, res: Response) => {
  res.json({
    '@context': {
      '@version': 1.1,
      'sonate': 'https://yseeku.com/ns/trust#',
      'TrustReceiptCredential': 'sonate:TrustReceiptCredential',
      'trustScore': 'sonate:trustScore',
      'ciqMetrics': 'sonate:ciqMetrics',
      'clarity': 'sonate:clarity',
      'integrity': 'sonate:integrity',
      'quality': 'sonate:quality',
      'sessionId': 'sonate:sessionId',
      'agentId': 'sonate:agentId',
      'chain': 'sonate:chain',
      'selfHash': 'sonate:selfHash',
      'previousHash': 'sonate:previousHash',
      'chainHash': 'sonate:chainHash',
      'evaluation': 'sonate:evaluation',
      'principlesEvaluated': 'sonate:principlesEvaluated',
    },
  });
});

/**
 * GET /api/credentials/status/:listId
 * Get credential status list (for revocation checking)
 */
router.get('/status/:listId', (req: Request, res: Response) => {
  const { listId } = req.params;
  
  // In production, this would return the actual status list credential
  res.json({
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/vc/status-list/2021/v1'
    ],
    id: `https://yseeku.com/credentials/status/${listId}`,
    type: ['VerifiableCredential', 'StatusList2021Credential'],
    issuer: 'did:web:yseeku.com',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `https://yseeku.com/credentials/status/${listId}#list`,
      type: 'StatusList2021',
      statusPurpose: 'revocation',
      encodedList: 'H4sIAAAAAAAAA-3BMQEAAADCoPVP...' // Compressed bitstring
    }
  });
});

export default router;
