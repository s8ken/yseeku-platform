/**
 * Public Key Routes
 * 
 * Exposes the platform's Ed25519 public key for receipt verification.
 * This allows third parties to verify trust receipts independently
 * without needing to call any authenticated API.
 * 
 * Standard endpoint: /.well-known/sonate-pubkey.json
 */

import { Router, Request, Response } from 'express';
import { keysService } from '../services/keys.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /.well-known/sonate-pubkey.json
 * Returns the platform's Ed25519 public key for receipt verification
 * 
 * Response format follows JWK (JSON Web Key) style for Ed25519
 */
router.get('/sonate-pubkey.json', async (req: Request, res: Response) => {
  try {
    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    // Convert hex to base64url for JWK format
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const publicKeyBase64url = publicKeyBytes.toString('base64url');

    const response = {
      // JWK format
      kty: 'OKP',
      crv: 'Ed25519',
      x: publicKeyBase64url,
      
      // Additional metadata
      kid: 'sonate-trust-signing-key-v1',
      use: 'sig',
      alg: 'EdDSA',
      
      // SONATE-specific metadata
      sonate: {
        version: '1.0.0',
        purpose: 'trust-receipt-verification',
        algorithm: 'Ed25519',
        keyFormat: {
          hex: publicKeyHex,
          base64url: publicKeyBase64url,
        },
        verificationGuide: 'https://docs.yseeku.com/trust-receipts/verification',
      },
      
      // Timestamps
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
    };

    // Set caching headers (public key doesn't change often)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for verification

    logger.info('Public key served', { ip: req.ip });

    return res.json(response);

  } catch (error: unknown) {
    logger.error('Failed to serve public key', { error: getErrorMessage(error) });
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve public key',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /.well-known/sonate-pubkey (plain text version)
 * Returns just the hex-encoded public key
 */
router.get('/sonate-pubkey', async (req: Request, res: Response) => {
  try {
    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.send(publicKeyHex);

  } catch (error: unknown) {
    logger.error('Failed to serve public key (plain)', { error: getErrorMessage(error) });
    return res.status(500).send('Error retrieving public key');
  }
});

export default router;
