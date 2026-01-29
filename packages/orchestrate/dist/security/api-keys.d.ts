/**
 * API Key Management System
 * Provides secure API key generation, validation, and management
 */
export interface APIKey {
    id: string;
    key: string;
    prefix: string;
    name: string;
    description?: string;
    userId: string;
    scopes: string[];
    rateLimit?: number;
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
export declare class APIKeyManager {
    private logger;
    private keyStore;
    /**
     * Generate a new API key
     */
    generateKey(userId: string, name: string, options?: {
        description?: string;
        scopes?: string[];
        rateLimit?: number;
        expiresAt?: Date;
        metadata?: Record<string, any>;
    }): Promise<{
        key: APIKey;
        rawKey: string;
    }>;
    /**
     * Validate an API key
     */
    validateKey(rawKey: string): Promise<APIKeyValidationResult>;
    /**
     * Revoke an API key
     */
    revokeKey(keyId: string, userId: string): Promise<boolean>;
    /**
     * List API keys for a user
     */
    listKeys(userId: string): Promise<APIKey[]>;
    /**
     * Get API key by ID
     */
    getKey(keyId: string): Promise<APIKey | null>;
    /**
     * Update API key metadata
     */
    updateKey(keyId: string, userId: string, updates: {
        name?: string;
        description?: string;
        scopes?: string[];
        rateLimit?: number;
        metadata?: Record<string, any>;
    }): Promise<APIKey | null>;
    /**
     * Rotate an API key (generate new key, revoke old one)
     */
    rotateKey(keyId: string, userId: string): Promise<{
        key: APIKey;
        rawKey: string;
    } | null>;
    /**
     * Clean up expired keys
     */
    cleanupExpiredKeys(): Promise<number>;
    /**
     * Express middleware for API key authentication
     */
    middleware(): (req: any, res: any, next: any) => Promise<any>;
    private generateRandomKey;
    private hashKey;
    private timingSafeEqual;
    private generateId;
}
export declare function getAPIKeyManager(): APIKeyManager;
export declare function resetAPIKeyManager(): void;
//# sourceMappingURL=api-keys.d.ts.map