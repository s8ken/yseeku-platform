/**
 * Key Rotation API Routes
 * 
 * Admin endpoints for managing signing key lifecycle:
 * - View key versions and status
 * - Trigger manual rotation
 * - Revoke compromised keys
 * - Get public keys for verification
 */

import { Router, Request, Response } from 'express';
import { keyRotationService } from '../services/key-rotation.service';
import { protect, requireRole } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/keys/status
 * Get current key rotation status
 * Requires: authenticated user
 */
router.get('/status', protect, async (req: Request, res: Response) => {
  try {
    const status = await keyRotationService.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get key status', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to get key status',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/keys/versions
 * List all key versions (without private keys)
 * Requires: admin role
 */
router.get('/versions', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const versions = keyRotationService.listVersions();
    
    res.json({
      success: true,
      data: {
        currentVersion: keyRotationService.getCurrentVersion(),
        versions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to list key versions', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to list key versions',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/keys/public
 * Get current public key
 * Public endpoint - no auth required
 */
router.get('/public', async (req: Request, res: Response) => {
  try {
    const publicKey = await keyRotationService.getPublicKey();
    const currentVersion = keyRotationService.getCurrentVersion();
    
    res.json({
      success: true,
      data: {
        version: currentVersion,
        publicKey,
        algorithm: 'Ed25519',
        format: 'hex',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get public key', { error: getErrorMessage(error) });
    res.status(404).json({
      success: false,
      error: 'Key not found',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/keys/public/:version
 * Get public key for specific version
 * Public endpoint - no auth required
 */
router.get('/public/:version', async (req: Request, res: Response) => {
  try {
    const version = String(req.params.version);
    const publicKey = await keyRotationService.getPublicKey(version);
    
    res.json({
      success: true,
      data: {
        version,
        publicKey,
        algorithm: 'Ed25519',
        format: 'hex',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get public key', { error: getErrorMessage(error), version: req.params.version });
    res.status(404).json({
      success: false,
      error: 'Key not found',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/keys/rotate
 * Trigger manual key rotation
 * Requires: admin role
 */
router.post('/rotate', protect, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    logger.info('Manual key rotation triggered', { 
      triggeredBy: (req as any).user?.email || 'unknown',
      reason: reason || 'manual rotation'
    });
    
    const newKey = await keyRotationService.rotate();
    
    res.json({
      success: true,
      data: {
        version: newKey.version,
        publicKey: newKey.publicKey,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
        status: newKey.status,
      },
      message: 'Key rotation completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Key rotation failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Key rotation failed',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/keys/revoke/:version
 * Revoke a specific key version
 * Requires: admin role
 */
router.post('/revoke/:version', protect, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const version = String(req.params.version);
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Reason required for key revocation',
      });
      return;
    }
    
    logger.warn('Key revocation requested', {
      version,
      reason: String(reason),
      revokedBy: (req as any).user?.email || 'unknown'
    });
    
    await keyRotationService.revokeVersion(version, String(reason));
    
    res.json({
      success: true,
      message: `Key version ${version} has been revoked`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Key revocation failed', { error: getErrorMessage(error), version: req.params.version });
    res.status(400).json({
      success: false,
      error: 'Key revocation failed',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/keys/verify
 * Verify a signature with automatic key version detection
 * Public endpoint - no auth required
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature, keyVersion } = req.body;
    
    if (!message || !signature) {
      res.status(400).json({
        success: false,
        error: 'Message and signature are required',
      });
      return;
    }
    
    const result = await keyRotationService.verify(
      String(message), 
      String(signature), 
      keyVersion ? String(keyVersion) : undefined
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Signature verification failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: getErrorMessage(error),
    });
  }
});

export default router;
