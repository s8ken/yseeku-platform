"use strict";
/**
 * API Key Management System
 * Provides secure API key generation, validation, and management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIKeyManager = void 0;
exports.getAPIKeyManager = getAPIKeyManager;
exports.resetAPIKeyManager = resetAPIKeyManager;
const crypto = __importStar(require("crypto"));
const logger_1 = require("../observability/logger");
const audit_1 = require("./audit");
class APIKeyManager {
    constructor() {
        this.logger = new logger_1.Logger('APIKeyManager');
        this.keyStore = new Map(); // In-memory store (use database in production)
    }
    /**
     * Generate a new API key
     */
    async generateKey(userId, name, options = {}) {
        // Generate random key
        const rawKey = this.generateRandomKey();
        const hashedKey = this.hashKey(rawKey);
        const prefix = rawKey.substring(0, 8);
        const key = {
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
        const audit = (0, audit_1.getAuditLogger)();
        await audit.log(audit_1.AuditEventType.AUTH_TOKEN_CREATED, 'API key created', 'success', {
            userId,
            resourceType: 'api_key',
            resourceId: key.id,
            details: {
                name: key.name,
                scopes: key.scopes,
                expiresAt: key.expiresAt,
            },
        });
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
    async validateKey(rawKey) {
        try {
            const hashedKey = this.hashKey(rawKey);
            const prefix = rawKey.substring(0, 8);
            // Find key by prefix first (optimization)
            const keys = Array.from(this.keyStore.values()).filter((k) => k.prefix === prefix);
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
            const audit = (0, audit_1.getAuditLogger)();
            await audit.log(audit_1.AuditEventType.AUTH_FAILED, 'Invalid API key', 'failure', {
                details: { prefix },
            });
            return {
                valid: false,
                error: 'Invalid API key',
            };
        }
        catch (error) {
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
    async revokeKey(keyId, userId) {
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
        const audit = (0, audit_1.getAuditLogger)();
        await audit.log(audit_1.AuditEventType.AUTH_TOKEN_REVOKED, 'API key revoked', 'success', {
            userId,
            resourceType: 'api_key',
            resourceId: keyId,
            details: {
                name: key.name,
            },
        });
        this.logger.info('API key revoked', { keyId, userId });
        return true;
    }
    /**
     * List API keys for a user
     */
    async listKeys(userId) {
        return Array.from(this.keyStore.values())
            .filter((k) => k.userId === userId)
            .map((k) => ({
            ...k,
            key: '***', // Never return the actual key
        }));
    }
    /**
     * Get API key by ID
     */
    async getKey(keyId) {
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
    async updateKey(keyId, userId, updates) {
        const key = this.keyStore.get(keyId);
        if (!key || key.userId !== userId) {
            return null;
        }
        // Apply updates
        if (updates.name) {
            key.name = updates.name;
        }
        if (updates.description !== undefined) {
            key.description = updates.description;
        }
        if (updates.scopes) {
            key.scopes = updates.scopes;
        }
        if (updates.rateLimit !== undefined) {
            key.rateLimit = updates.rateLimit;
        }
        if (updates.metadata) {
            key.metadata = { ...key.metadata, ...updates.metadata };
        }
        this.keyStore.set(keyId, key);
        this.logger.info('API key updated', { keyId, userId });
        return key;
    }
    /**
     * Rotate an API key (generate new key, revoke old one)
     */
    async rotateKey(keyId, userId) {
        const oldKey = this.keyStore.get(keyId);
        if (!oldKey || oldKey.userId !== userId) {
            return null;
        }
        // Generate new key with same properties
        const { key: newKey, rawKey } = await this.generateKey(userId, oldKey.name, {
            description: oldKey.description,
            scopes: oldKey.scopes,
            rateLimit: oldKey.rateLimit,
            expiresAt: oldKey.expiresAt,
            metadata: oldKey.metadata,
        });
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
    async cleanupExpiredKeys() {
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
        return async (req, res, next) => {
            try {
                // Extract API key from header
                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
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
                req.userId = result.key.userId;
                // Set rate limit if specified
                if (result.key.rateLimit) {
                    req.rateLimit = result.key.rateLimit;
                }
                next();
            }
            catch (error) {
                this.logger.error('API key middleware error', { error });
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Authentication error',
                });
            }
        };
    }
    generateRandomKey() {
        // Generate a secure random key
        // Format: sonate_<32 random chars>
        const randomBytes = crypto.randomBytes(24);
        const randomString = randomBytes
            .toString('base64')
            .replace(/\+/g, '')
            .replace(/\//g, '')
            .replace(/=/g, '')
            .substring(0, 32);
        return `sonate_${randomString}`;
    }
    hashKey(key) {
        // Use SHA-256 to hash the key
        return crypto.createHash('sha256').update(key).digest('hex');
    }
    timingSafeEqual(a, b) {
        // Timing-safe string comparison to prevent timing attacks
        if (a.length !== b.length) {
            return false;
        }
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        return crypto.timingSafeEqual(bufA, bufB);
    }
    generateId() {
        return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
}
exports.APIKeyManager = APIKeyManager;
// Singleton instance
let apiKeyManager = null;
function getAPIKeyManager() {
    if (!apiKeyManager) {
        apiKeyManager = new APIKeyManager();
    }
    return apiKeyManager;
}
function resetAPIKeyManager() {
    apiKeyManager = null;
}
