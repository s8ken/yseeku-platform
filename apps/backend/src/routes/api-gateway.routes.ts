/**
 * API Gateway Routes
 * Manage Platform API Keys and Rate Limits
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.middleware';
import { PlatformApiKey } from '../models/platform-api-key.model';
import { logSuccess, logFailure } from '../utils/audit-logger';
import logger from '../utils/logger';
import { requireScopes } from '../middleware/rbac.middleware';
import { apiGatewayLimiter } from '../middleware/rate-limiters';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * Generate a secure random API key
 * Format: sk_[env]_[random_chars]
 */
const generateApiKey = (env = 'live') => {
  const buffer = crypto.randomBytes(24);
  return `sk_${env}_${buffer.toString('hex')}`;
};

/**
 * GET /api/gateway/keys
 * List all platform API keys for the current user/tenant
 */
router.get('/keys', protect, requireScopes(['gateway:manage']), apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    
    // Find keys for this user
    // In a real app, you might want admins to see all keys for the tenant
    const keys = await PlatformApiKey.find({ 
      tenantId: userTenant 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        keys: keys.map(k => ({
          id: k._id,
          name: k.name,
          prefix: k.prefix,
          status: k.status,
          scopes: k.scopes,
          lastUsed: k.lastUsed,
          requests24h: k.requests24h,
          createdAt: k.createdAt,
          // key is NOT returned here for security
        })),
      },
    });
  } catch (error: unknown) {
    logger.error('List API keys error', { error: getErrorMessage(error), userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to list API keys',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/gateway/keys
 * Create a new platform API key
 */
router.post('/keys', protect, requireScopes(['gateway:manage']), apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, scopes, expiresIn } = req.body;
    const userTenant = req.userTenant || 'default';

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Key name is required',
      });
      return;
    }

    // Generate full key
    const rawKey = generateApiKey();
    const prefix = rawKey.substring(0, 12) + '...'; // e.g., sk_live_a1b2...

    // Hash key for storage
    const salt = await bcrypt.genSalt(10);
    const keyHash = await bcrypt.hash(rawKey, salt);

    // Calculate expiry if provided
    let expiresAt;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }

    const apiKey = await PlatformApiKey.create({
      userId: req.userId,
      tenantId: userTenant,
      name,
      keyHash,
      prefix,
      scopes: scopes || ['read:all'],
      expiresAt,
    });

    // Log audit
    await logSuccess(req, 'api_key_create', 'platform-key', apiKey._id.toString(), {
      name,
      scopes: apiKey.scopes,
    });

    // Return the FULL key only once
    res.status(201).json({
      success: true,
      message: 'API Key created successfully',
      data: {
        key: {
          id: apiKey._id,
          name: apiKey.name,
          prefix: apiKey.prefix,
          status: apiKey.status,
          scopes: apiKey.scopes,
          createdAt: apiKey.createdAt,
          // IMPORTANT: Return raw key so user can copy it
          fullKey: rawKey, 
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Create API key error', { error: getErrorMessage(error), userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/gateway/keys/:id
 * Revoke (delete) an API key
 */
router.delete('/keys/:id', protect, requireScopes(['gateway:manage']), apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userTenant = req.userTenant || 'default';

    const apiKey = await PlatformApiKey.findOne({
      _id: id,
      tenantId: userTenant,
    });

    if (!apiKey) {
      res.status(404).json({
        success: false,
        message: 'API Key not found',
      });
      return;
    }

    // Instead of hard delete, we mark as revoked or delete?
    // Let's hard delete for MVP simplicity, or user choice
    await PlatformApiKey.deleteOne({ _id: id });

    // Log audit
    await logSuccess(req, 'api_key_revoke', 'platform-key', String(id), {
      name: apiKey.name,
    });

    res.json({
      success: true,
      message: 'API Key revoked successfully',
    });
  } catch (error: unknown) {
    logger.error('Revoke API key error', { error: getErrorMessage(error), userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PUT /api/gateway/keys/:id
 * Update API key (name, scopes, status)
 */
router.put('/keys/:id', protect, requireScopes(['gateway:manage']), apiGatewayLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, status, scopes } = req.body;
    const userTenant = req.userTenant || 'default';

    const apiKey = await PlatformApiKey.findOne({
      _id: id,
      tenantId: userTenant,
    });

    if (!apiKey) {
      res.status(404).json({
        success: false,
        message: 'API Key not found',
      });
      return;
    }

    if (name) apiKey.name = name;
    if (status) apiKey.status = status;
    if (scopes) apiKey.scopes = scopes;

    await apiKey.save();

    res.json({
      success: true,
      message: 'API Key updated successfully',
      data: {
        key: {
          id: apiKey._id,
          name: apiKey.name,
          status: apiKey.status,
          scopes: apiKey.scopes,
        },
      },
    });
  } catch (error: unknown) {
    logger.error('Update API key error', { error: getErrorMessage(error), userId: req.userId });
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: getErrorMessage(error),
    });
  }
});

export default router;
