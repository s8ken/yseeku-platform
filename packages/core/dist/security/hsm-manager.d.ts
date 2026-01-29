/**
 * Hardware Security Module (HSM) Integration
 *
 * Provides enterprise-grade key management with HSM support
 * Fallback to software-based management when HSM is unavailable
 */
export interface HSMConfig {
    enabled: boolean;
    provider?: 'aws-cloudhsm' | 'azure-key-vault' | 'gcp-kms' | 'soft-hsm' | 'none';
    endpoint?: string;
    credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
        clientId?: string;
        clientSecret?: string;
        tenantId?: string;
        keyId?: string;
    };
    region?: string;
    keyRotationDays?: number;
}
export interface KeyMetadata {
    keyId: string;
    algorithm: string;
    keySize: number;
    createdAt: number;
    lastRotated: number;
    rotationSchedule: number;
    status: 'active' | 'rotating' | 'deprecated' | 'revoked';
}
export interface KeyPair {
    publicKey: Uint8Array;
    privateKey?: Uint8Array;
    keyId: string;
}
export interface SignResult {
    signature: Uint8Array;
    keyId: string;
    timestamp: number;
}
export interface VerifyResult {
    valid: boolean;
    keyId: string;
    timestamp: number;
}
/**
 * HSM Manager for enterprise key management
 */
export declare class HSMManager {
    private config;
    private keyCache;
    private keyMetadata;
    private rotationTimer?;
    constructor(config: HSMConfig);
    /**
     * Initialize HSM connection
     */
    private initializeHSM;
    /**
     * Initialize AWS CloudHSM
     */
    private initializeAWSCloudHSM;
    /**
     * Initialize Azure Key Vault
     */
    private initializeAzureKeyVault;
    /**
     * Initialize GCP KMS
     */
    private initializeGCPKMS;
    /**
     * Initialize SoftHSM (software HSM simulation)
     */
    private initializeSoftHSM;
    /**
     * Validate AWS connection
     */
    private validateAWSConnection;
    /**
     * Validate Azure connection
     */
    private validateAzureConnection;
    /**
     * Validate GCP connection
     */
    private validateGCPConnection;
    /**
     * Generate a new Ed25519 key pair
     */
    generateKeyPair(keyId?: string): Promise<KeyPair>;
    /**
     * Generate key pair in HSM
     */
    private generateKeyPairInHSM;
    /**
     * Generate key pair in AWS CloudHSM
     */
    private generateKeyPairAWS;
    /**
     * Generate key pair in Azure Key Vault
     */
    private generateKeyPairAzure;
    /**
     * Generate key pair in GCP KMS
     */
    private generateKeyPairGCP;
    /**
     * Generate software key pair (fallback)
     */
    private generateKeyPairSoftware;
    /**
     * Sign data with a key
     */
    sign(keyId: string, message: Uint8Array): Promise<SignResult>;
    /**
     * Sign data in HSM
     */
    private signInHSM;
    /**
     * Sign with AWS CloudHSM
     */
    private signAWS;
    /**
     * Sign with Azure Key Vault
     */
    private signAzure;
    /**
     * Sign with GCP KMS
     */
    private signGCP;
    /**
     * Sign with software (fallback)
     */
    private signSoftware;
    /**
     * Verify signature
     */
    verify(keyId: string, message: Uint8Array, signature: Uint8Array): Promise<VerifyResult>;
    /**
     * Rotate a key
     */
    rotateKey(keyId: string): Promise<KeyPair>;
    /**
     * Start key rotation schedule
     */
    private startRotationSchedule;
    /**
     * Rotate all keys due for rotation
     */
    private rotateAllKeys;
    /**
     * Get key metadata
     */
    getKeyMetadata(keyId: string): KeyMetadata | undefined;
    /**
     * Get all keys
     */
    getAllKeys(): KeyMetadata[];
    /**
     * Delete a key
     */
    deleteKey(keyId: string): Promise<void>;
    /**
     * Export public key
     */
    exportPublicKey(keyId: string): Uint8Array;
    /**
     * Get health status
     */
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        hsmEnabled: boolean;
        hsmProvider: string | undefined;
        totalKeys: number;
        activeKeys: number;
        rotationSchedule: string;
    }>;
    /**
     * Shutdown HSM manager
     */
    shutdown(): Promise<void>;
    /**
     * Get private key (only for software-based management)
     */
    private getPrivateKey;
}
/**
 * Create HSM manager with default configuration
 */
export declare function createHSMManager(config?: Partial<HSMConfig>): Promise<HSMManager>;
/**
 * Create HSM manager from environment variables
 */
export declare function createHSMManagerFromEnv(): HSMManager;
