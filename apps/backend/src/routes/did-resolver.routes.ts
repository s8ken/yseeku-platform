/**
 * DID Resolver API Routes
 * 
 * HTTP endpoints for DID management and resolution
 * 
 * Endpoints:
 * - POST   /api/v1/dids/create               Create new DID
 * - GET    /api/v1/dids/:did                 Resolve DID
 * - POST   /api/v1/dids/:did/rotate-key      Rotate DID key
 * - DELETE /api/v1/dids/:did                 Revoke DID
 * - GET    /api/v1/dids/:did/history         Get key history
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { DIDResolverService } from '@sonate/orchestrate';
import logger from '../utils/logger';

const router = Router();

// Initialize service
const didResolver = new DIDResolverService();

/**
 * Zod schemas for validation
 */
const CreateDIDSchema = z.object({
  publicKey: z.string().min(1, 'Public key required'),
  keyType: z.enum(['Ed25519']).optional().default('Ed25519'),
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

const RotateKeySchema = z.object({
  newPublicKey: z.string().min(1, 'New public key required'),
});

/**
 * Validate DID format
 */
function isValidDID(did: string): boolean {
  return /^did:sonate:[a-zA-Z0-9]{40}$/.test(did);
}

/**
 * POST /api/v1/dids/create
 * Create a new DID with initial public key
 */
router.post(
  '/create',
  protect,
  validateBody(CreateDIDSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { publicKey, keyType, metadata } = req.body;

      // Create DID
      const did = didResolver.createDID(publicKey, keyType);

      res.status(201).json({
        success: true,
        data: {
          did: did.id,
          public_key: did.document.public_keys[0].value,
          key_version: did.current_key_version,
          active: did.active,
          created_at: did.document.created_at,
        },
      });
    } catch (err) {
      logger.error('DID creation failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

/**
 * GET /api/v1/dids/:did
 * Resolve a DID to get current public key
 */
router.get(
  '/:did',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { did } = req.params;

      // Validate DID format
      if (!isValidDID(did as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid DID format',
        });
        return;
      }

      // Resolve DID
      const resolved = didResolver.resolveDID(did as string);

      if (!resolved) {
        res.status(404).json({
          success: false,
          error: 'DID not found or inactive',
        });
        return;
      }

      res.json({
        success: true,
        data: resolved,
      });
    } catch (err) {
      logger.error('DID resolution failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

/**
 * POST /api/v1/dids/:did/rotate-key
 * Rotate a DID's key (security measure)
 */
router.post(
  '/:did/rotate-key',
  protect,
  validateBody(RotateKeySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { did } = req.params;
      const { newPublicKey } = req.body;

      // Validate DID format
      if (!isValidDID(did as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid DID format',
        });
        return;
      }

      // Rotate key
      const updated = didResolver.rotateKey(did as string, newPublicKey);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          did: updated.id,
          new_key_version: updated.current_key_version,
          new_public_key: newPublicKey,
          updated_at: updated.document.updated_at,
        },
      });
    } catch (err) {
      logger.error('Key rotation failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/dids/:did
 * Revoke a DID (make inactive)
 */
router.delete(
  '/:did',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { did } = req.params;

      // Validate DID format
      if (!isValidDID(did as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid DID format',
        });
        return;
      }

      // Revoke DID
      const revoked = didResolver.revokeDID(did as string);

      if (!revoked) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          did: revoked.id,
          active: revoked.active,
          revoked_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error('DID revocation failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

/**
 * GET /api/v1/dids/:did/history
 * Get key rotation history for a DID
 */
router.get(
  '/:did/history',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { did } = req.params;

      // Validate DID format
      if (!isValidDID(did as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid DID format',
        });
        return;
      }

      // Get key history
      const history = didResolver.getKeyHistory(did as string);

      if (!history) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          did,
          key_history: history,
        },
      });
    } catch (err) {
      logger.error('History fetch failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

/**
 * GET /api/v1/dids/:did/document
 * Get full DID document
 */
router.get(
  '/:did/document',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { did } = req.params;

      // Validate DID format
      if (!isValidDID(did as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid DID format',
        });
        return;
      }

      // Get DID document
      const doc = didResolver.getDIDDocument(did as string);

      if (!doc) {
        res.status(404).json({
          success: false,
          error: 'DID not found',
        });
        return;
      }

      res.json({
        success: true,
        data: doc,
      });
    } catch (err) {
      logger.error('Document fetch failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }
);

export default router;
