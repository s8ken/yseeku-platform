/**
 * API Key Management System
 * Provides secure API key generation, validation, and management
 */

import * as crypto from 'crypto';
import { Logger } from '../observability/logger';
import { getAuditLogger, AuditEventType } from './audit';

export interface APIKey {
  id: string;
  key: string;           // Hashed key stored in database
  prefix: string;        // First 8 chars for identification
  name: string;
  description?: string;
  userId: string;
  scopes: string[];      // Permissions/scopes for this key
  rateLimit?: number;    // Custom rate limit for this key
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface APIKeyValidationResult {
  valid: boolean;
  key?: APIKey;
  error?: string;
}

export class APIKeyManager {
  private logger = new Logger('APIKeyManager');
  private keyStore: Map<string, APIKey> = new Map(); // In-memory store (use database in production)

  /**
   * Generate a new API key
   */
  async generateKey(
    userId: string,
    name: string,
    options: {
      description?: string;
      scopes?: string[];
      rateLimit?: number;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ key: APIKey; rawKey: string }> {
    // Generate random key
    const rawKey = this.generateRandomKey();
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.substring(0, 8);

    const key: APIKey = {
      id: this.generateId(),
      key: hashedKey,
      prefix,
      name,
      description: options.description,
      userId,
      scopes: options.scopes || [],
      rateLimit: options.rateLimit,
      expiresAt: options.expiresAt,
      createdAt: new Date(),
      isActive: true,
      metadata: options.metadata,
    };

    // Store the key
    this.keyStore.set(key.id, key);

    // Log to audit
    const audit = getAuditLogger();
    await audit.log(
      AuditEventType.AUTH_TOKEN_CREATED,
      'API key created',
      'success',
      {
        userId,
        resourceType: 'api_key',
        resourceId: key.id,
        details: {
          name: key.name,
          scopes: key.scopes,
          expiresAt: key.expiresAt,
        },
      }
    );

    this.logger.info('API key generated', {
      keyId: key.id,
      userId,
      name: key.name,
    });

    // Return both the key object and the raw key (only time it's available)
    return { key, rawKey };
  }

  /**
   * Validate an API key
   */
  async validateKey(rawKey: string): Promise<APIKeyValidationResult> {
    try {
      const hashedKey = this.hashKey(rawKey);
      const prefix = rawKey.substring(0, 8);

      // Find key by prefix first (optimization)
      const keys = Array.from(this.keyStore.values()).filter(
        k => k.prefix === prefix
      );

      for (const key of keys) {
        // Use timing-safe comparison
        if (this.timingSafeEqual(key.key, hashedKey)) {
          // Check if key is active
          if (!key.isActive) {
            return {
              valid: false,
              error: 'API key is inactive',
            };
          }

          // Check if key is expired
          if (key.expiresAt && new Date() > key.expiresAt) {
            return {
              valid: false,
              error: 'API key has expired',
            };
          }

          // Update last used timestamp
          key.lastUsedAt = new Date();
          this.keyStore.set(key.id, key);

          return {
            valid: true,
            key,
          };
        }
      }

      // Log failed validation attempt
      const audit = getAuditLogger();
      await audit.log(
        AuditEventType.AUTH_FAILED,
        'Invalid API key',
        'failure',
        {
          details: { prefix },
        }
      );

      return {
        valid: false,
        error: 'Invalid API key',
      };
    } catch (error) {
      this.logger.error('Error validating API key', { error });
      return {
        valid: false,
        error: 'Validation error',
      };
    }
  }

  /**
   * Revoke an API key
   */
  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    const key = this.keyStore.get(keyId);
    
    if (!key) {
      return false;
    }

    // Check ownership
    if (key.userId !== userId) {
      this.logger.warn('Unauthorized key revocation attempt', {
        keyId,
        userId,
        ownerId: key.userId,
      });
      return false;
    }

    // Deactivate the key
    key.isActive = false;
    this.keyStore.set(keyId, key);

    // Log to audit
    const audit = getAuditLogger();
    await audit.log(
      AuditEventType.AUTH_TOKEN_REVOKED,
      'API key revoked',
      'success',
      {
        userId,
        resourceType: 'api_key',
        resourceId: keyId,
        details: {
          name: key.name,
        },
      }
    );

    this.logger.info('API key revoked', { keyId, userId });
    return true;
  }

  /**
   * List API keys for a user
   */
  async listKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.keyStore.values())
      .filter(k => k.userId === userId)
      .map(k => ({
        ...k,
        key: '***', // Never return the actual key
      }));
  }

  /**
   * Get API key by ID
   */
  async getKey(keyId: string): Promise<APIKey | null> {
    const key = this.keyStore.get(keyId);
    if (!key) {
      return null;
    }

    return {
      ...key,
      key: '***', // Never return the actual key
    };
  }

  /**
   * Update API key metadata
   */
  async updateKey(
    keyId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      scopes?: string[];
      rateLimit?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<APIKey | null> {
    const key = this.keyStore.get(keyId);
    
    if (!key || key.userId !== userId) {
      return null;
    }

    // Apply updates
    if (updates.name) key.name = updates.name;
    if (updates.description !== undefined) key.description = updates.description;
    if (updates.scopes) key.scopes = updates.scopes;
    if (updates.rateLimit !== undefined) key.rateLimit = updates.rateLimit;
    if (updates.metadata) key.metadata = { ...key.metadata, ...updates.metadata };

    this.keyStore.set(keyId, key);

    this.logger.info('API key updated', { keyId, userId });
    return key;
  }

  /**
   * Rotate an API key (generate new key, revoke old one)
   */
  async rotateKey(keyId: string, userId: string): Promise<{ key: APIKey; rawKey: string } | null> {
    const oldKey = this.keyStore.get(keyId);
    
    if (!oldKey || oldKey.userId !== userId) {
      return null;
    }

    // Generate new key with same properties
    const { key: newKey, rawKey } = await this.generateKey(
      userId,
      oldKey.name,
      {
        description: oldKey.description,
        scopes: oldKey.scopes,
        rateLimit: oldKey.rateLimit,
        expiresAt: oldKey.expiresAt,
        metadata: oldKey.metadata,
      }
    );

    // Revoke old key
    await this.revokeKey(keyId, userId);

    this.logger.info('API key rotated', {
      oldKeyId: keyId,
      newKeyId: newKey.id,
      userId,
    });

    return { key: newKey, rawKey };
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [id, key] of this.keyStore.entries()) {
      if (key.expiresAt && now > key.expiresAt && key.isActive) {
        key.isActive = false;
        this.keyStore.set(id, key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.info('Cleaned up expired API keys', { count });
    }

    return count;
  }

  /**
   * Express middleware for API key authentication
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Extract API key from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key required',
          });
        }

        const rawKey = authHeader.substring(7); // Remove 'Bearer ' prefix
        const result = await this.validateKey(rawKey);

        if (!result.valid) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: result.error || 'Invalid API key',
          });
        }

        // Attach key info to request
        req.apiKey = result.key;
        req.userId = result.key!.userId;

        // Set rate limit if specified
        if (result.key!.rateLimit) {
          req.rateLimit = result.key!.rateLimit;
        }

        next();
      } catch (error) {
        this.logger.error('API key middleware error', { error });
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication error',
        });
      }
    };
  }

  private generateRandomKey(): string {
    // Generate a secure random key
    // Format: symbi_<32 random chars>
    const randomBytes = crypto.randomBytes(24);
    const randomString = randomBytes.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '')
      .substring(0, 32);
    
    return `symbi_${randomString}`;
  }

  private hashKey(key: string): string {
    // Use SHA-256 to hash the key
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    // Timing-safe string comparison to prevent timing attacks
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }

  private generateId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
}

// Singleton instance
let apiKeyManager: APIKeyManager | null = null;

export function getAPIKeyManager(): APIKeyManager {
  if (!apiKeyManager) {
    apiKeyManager = new APIKeyManager();
  }
  return apiKeyManager;
}

export function resetAPIKeyManager(): void {
  apiKeyManager = null;
}