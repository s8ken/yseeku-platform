/**
 * Credential Store for SONATE Protocol
 * Provides secure storage and retrieval of authentication credentials
 */
export declare enum CredentialType {
    API_KEY = "api_key",
    PASSWORD = "password",
    ACCESS_TOKEN = "access_token",
    REFRESH_TOKEN = "refresh_token",
    SECRET_KEY = "secret_key",
    CERTIFICATE = "certificate",
    DATABASE_CREDENTIALS = "database_credentials"
}
export interface Credential {
    id: string;
    type: CredentialType;
    name: string;
    description?: string;
    userId: string;
    encryptedValue: string;
    salt: string;
    scopes?: string[];
    expiresAt?: Date;
    createdAt: Date;
    lastAccessedAt?: Date;
    rotationRequired: boolean;
    rotationDate?: Date;
    metadata?: Record<string, any>;
}
export interface CredentialAccessRequest {
    userId: string;
    credentialId: string;
    action: 'read' | 'write' | 'delete' | 'rotate';
    context?: Record<string, any>;
}
export interface StorageBackend {
    store(credential: Credential): Promise<void>;
    retrieve(id: string): Promise<Credential | null>;
    list(userId: string): Promise<Credential[]>;
    delete(id: string): Promise<boolean>;
    update(id: string, credential: Partial<Credential>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
export interface CredentialValidationResult {
    valid: boolean;
    credential?: Credential;
    error?: string;
}
export interface CredentialStoreConfig {
    encryptionKey: string;
    defaultBackend: 'memory' | 'sonate-vault';
    auditEnabled: boolean;
    maxRetries: number;
    cacheEnabled: boolean;
    cacheTTL: number;
}
/**
 * Encryption utilities for credential storage
 */
export declare class CredentialEncryption {
    private static readonly ALGORITHM;
    private static readonly KEY_LENGTH;
    private static readonly IV_LENGTH;
    private static readonly TAG_LENGTH;
    /**
     * Encrypt a credential value
     */
    static encrypt(value: string, encryptionKey: string): {
        encrypted: string;
        iv: string;
        tag: string;
        salt: string;
    };
    /**
     * Decrypt a credential value
     */
    static decrypt(encrypted: string, iv: string, tag: string, salt: string, encryptionKey: string): string;
    /**
     * Generate a secure encryption key
     */
    static generateKey(): string;
    /**
     * Validate encryption key format
     */
    static validateKey(key: string): boolean;
}
/**
 * In-memory storage backend for development/testing
 */
export declare class MemoryStorageBackend implements StorageBackend {
    private credentials;
    private userIndex;
    store(credential: Credential): Promise<void>;
    retrieve(id: string): Promise<Credential | null>;
    list(userId: string): Promise<Credential[]>;
    delete(id: string): Promise<boolean>;
    update(id: string, updates: Partial<Credential>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
/**
 * SONATE-Vault storage backend for enterprise deployments
 */
export declare class SonateVaultStorageBackend implements StorageBackend {
    private vaultUrl;
    private authToken;
    private logger;
    constructor(vaultUrl: string, authToken: string);
    store(credential: Credential): Promise<void>;
    retrieve(id: string): Promise<Credential | null>;
    list(userId: string): Promise<Credential[]>;
    delete(id: string): Promise<boolean>;
    update(id: string, updates: Partial<Credential>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=credential-store.d.ts.map