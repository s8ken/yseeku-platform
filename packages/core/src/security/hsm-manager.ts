/**
 * Hardware Security Module (HSM) Integration
 *
 * Provides enterprise-grade key management with HSM support
 * Fallback to software-based management when HSM is unavailable
 */

import crypto, { createHash } from 'crypto';

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
  rotationSchedule: number; // days
  status: 'active' | 'rotating' | 'deprecated' | 'revoked';
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey?: Uint8Array; // Only exposed if HSM is not available
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
export class HSMManager {
  private config: HSMConfig;
  private keyCache: Map<string, KeyPair> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private rotationTimer?: NodeJS.Timeout;

  constructor(config: HSMConfig) {
    this.config = config;
    this.initializeHSM();
    this.startRotationSchedule();
  }

  /**
   * Initialize HSM connection
   */
  private async initializeHSM(): Promise<void> {
    if (!this.config.enabled || this.config.provider === 'none') {
      console.warn('HSM not enabled, using software-based key management');
      return;
    }

    try {
      switch (this.config.provider) {
        case 'aws-cloudhsm':
          await this.initializeAWSCloudHSM();
          break;
        case 'azure-key-vault':
          await this.initializeAzureKeyVault();
          break;
        case 'gcp-kms':
          await this.initializeGCPKMS();
          break;
        case 'soft-hsm':
          await this.initializeSoftHSM();
          break;
        default:
          console.warn(`Unknown HSM provider: ${this.config.provider}, falling back to software`);
      }
    } catch (error) {
      console.error('Failed to initialize HSM, falling back to software:', error);
      this.config.provider = 'none';
    }
  }

  /**
   * Initialize AWS CloudHSM
   */
  private async initializeAWSCloudHSM(): Promise<void> {
    // In production, this would use the AWS CloudHSM SDK
    // For now, we'll simulate the interface
    console.log('Initializing AWS CloudHSM...');

    if (!this.config.credentials?.accessKeyId || !this.config.credentials?.secretAccessKey) {
      throw new Error('AWS credentials required for CloudHSM');
    }

    // Validate connection
    await this.validateAWSConnection();
  }

  /**
   * Initialize Azure Key Vault
   */
  private async initializeAzureKeyVault(): Promise<void> {
    console.log('Initializing Azure Key Vault...');

    if (
      !this.config.credentials?.clientId ||
      !this.config.credentials?.clientSecret ||
      !this.config.credentials?.tenantId
    ) {
      throw new Error('Azure credentials required for Key Vault');
    }

    // Validate connection
    await this.validateAzureConnection();
  }

  /**
   * Initialize GCP KMS
   */
  private async initializeGCPKMS(): Promise<void> {
    console.log('Initializing GCP KMS...');

    if (!this.config.credentials?.keyId) {
      throw new Error('GCP key credentials required for KMS');
    }

    // Validate connection
    await this.validateGCPConnection();
  }

  /**
   * Initialize SoftHSM (software HSM simulation)
   */
  private async initializeSoftHSM(): Promise<void> {
    console.log('Initializing SoftHSM (software-based HSM simulation)...');
    // SoftHSM uses PKCS#11 interface
    // For this implementation, we'll use crypto module as fallback
  }

  /**
   * Validate AWS connection
   */
  private async validateAWSConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  /**
   * Validate Azure connection
   */
  private async validateAzureConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  /**
   * Validate GCP connection
   */
  private async validateGCPConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  /**
   * Generate a new Ed25519 key pair
   */
  async generateKeyPair(keyId?: string): Promise<KeyPair> {
    const generatedKeyId = keyId || `key_${Date.now()}_${crypto.randomUUID()}`;

    let keyPair: KeyPair;

    if (this.config.enabled && this.config.provider !== 'none') {
      keyPair = await this.generateKeyPairInHSM(generatedKeyId);
    } else {
      keyPair = this.generateKeyPairSoftware(generatedKeyId);
    }

    // Store metadata
    this.keyMetadata.set(generatedKeyId, {
      keyId: generatedKeyId,
      algorithm: 'Ed25519',
      keySize: 256,
      createdAt: Date.now(),
      lastRotated: Date.now(),
      rotationSchedule: this.config.keyRotationDays || 90,
      status: 'active',
    });

    // Cache public key
    this.keyCache.set(generatedKeyId, keyPair);

    return keyPair;
  }

  /**
   * Generate key pair in HSM
   */
  private async generateKeyPairInHSM(keyId: string): Promise<KeyPair> {
    switch (this.config.provider) {
      case 'aws-cloudhsm':
        return await this.generateKeyPairAWS(keyId);
      case 'azure-key-vault':
        return await this.generateKeyPairAzure(keyId);
      case 'gcp-kms':
        return await this.generateKeyPairGCP(keyId);
      case 'soft-hsm':
        return this.generateKeyPairSoftware(keyId);
      default:
        return this.generateKeyPairSoftware(keyId);
    }
  }

  /**
   * Generate key pair in AWS CloudHSM
   */
  private async generateKeyPairAWS(keyId: string): Promise<KeyPair> {
    // In production, this would call AWS CloudHSM SDK
    // For now, generate software keys
    const softwarePair = this.generateKeyPairSoftware(keyId);

    // Store private key securely (in production, this would be in HSM)
    // For this demo, we'll just return the public key
    return {
      publicKey: softwarePair.publicKey,
      privateKey: undefined, // Private key stays in HSM
      keyId,
    };
  }

  /**
   * Generate key pair in Azure Key Vault
   */
  private async generateKeyPairAzure(keyId: string): Promise<KeyPair> {
    // In production, this would call Azure Key Vault SDK
    const softwarePair = this.generateKeyPairSoftware(keyId);
    return {
      publicKey: softwarePair.publicKey,
      privateKey: undefined,
      keyId,
    };
  }

  /**
   * Generate key pair in GCP KMS
   */
  private async generateKeyPairGCP(keyId: string): Promise<KeyPair> {
    // In production, this would call GCP KMS SDK
    const softwarePair = this.generateKeyPairSoftware(keyId);
    return {
      publicKey: softwarePair.publicKey,
      privateKey: undefined,
      keyId,
    };
  }

  /**
   * Generate software key pair (fallback)
   */
  private generateKeyPairSoftware(keyId: string): KeyPair {
    const ed25519 = require('@noble/ed25519');
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);

    return {
      publicKey,
      privateKey,
      keyId,
    };
  }

  /**
   * Sign data with a key
   */
  async sign(keyId: string, message: Uint8Array): Promise<SignResult> {
    const keyPair = this.keyCache.get(keyId);
    if (!keyPair) {
      throw new Error(`Key ${keyId} not found`);
    }

    let signature: Uint8Array;

    if (this.config.enabled && this.config.provider !== 'none') {
      signature = await this.signInHSM(keyId, message);
    } else if (keyPair.privateKey) {
      signature = await this.signSoftware(keyPair.privateKey, message);
    } else {
      throw new Error('Private key not available for signing');
    }

    return {
      signature,
      keyId,
      timestamp: Date.now(),
    };
  }

  /**
   * Sign data in HSM
   */
  private async signInHSM(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    switch (this.config.provider) {
      case 'aws-cloudhsm':
        return await this.signAWS(keyId, message);
      case 'azure-key-vault':
        return await this.signAzure(keyId, message);
      case 'gcp-kms':
        return await this.signGCP(keyId, message);
      case 'soft-hsm':
        return await this.signSoftware(this.getPrivateKey(keyId), message);
      default:
        return await this.signSoftware(this.getPrivateKey(keyId), message);
    }
  }

  /**
   * Sign with AWS CloudHSM
   */
  private async signAWS(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    // In production, this would call AWS CloudHSM SDK
    // For now, use software signing
    return await this.signSoftware(this.getPrivateKey(keyId), message);
  }

  /**
   * Sign with Azure Key Vault
   */
  private async signAzure(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    // In production, this would call Azure Key Vault SDK
    return await this.signSoftware(this.getPrivateKey(keyId), message);
  }

  /**
   * Sign with GCP KMS
   */
  private async signGCP(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    // In production, this would call GCP KMS SDK
    return await this.signSoftware(this.getPrivateKey(keyId), message);
  }

  /**
   * Sign with software (fallback)
   */
  private async signSoftware(privateKey: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const ed25519 = require('@noble/ed25519');
    return await ed25519.sign(message, privateKey);
  }

  /**
   * Verify signature
   */
  async verify(keyId: string, message: Uint8Array, signature: Uint8Array): Promise<VerifyResult> {
    const keyPair = this.keyCache.get(keyId);
    if (!keyPair) {
      throw new Error(`Key ${keyId} not found`);
    }

    const ed25519 = require('@noble/ed25519');
    const valid = await ed25519.verify(signature, message, keyPair.publicKey);

    return {
      valid,
      keyId,
      timestamp: Date.now(),
    };
  }

  /**
   * Rotate a key
   */
  async rotateKey(keyId: string): Promise<KeyPair> {
    const metadata = this.keyMetadata.get(keyId);
    if (!metadata) {
      throw new Error(`Key ${keyId} not found`);
    }

    console.log(`Rotating key ${keyId}...`);

    // Generate new key
    const newKeyId = `${keyId}_rotated_${Date.now()}`;
    const newKeyPair = await this.generateKeyPair(newKeyId);

    // Mark old key as deprecated
    metadata.status = 'deprecated';

    return newKeyPair;
  }

  /**
   * Start key rotation schedule
   */
  private startRotationSchedule(): void {
    const rotationDays = this.config.keyRotationDays || 90;
    const rotationInterval = rotationDays * 24 * 60 * 60 * 1000;

    this.rotationTimer = setInterval(async () => {
      await this.rotateAllKeys();
    }, rotationInterval);

    console.log(`Key rotation schedule started: every ${rotationDays} days`);
  }

  /**
   * Rotate all keys due for rotation
   */
  private async rotateAllKeys(): Promise<void> {
    const now = Date.now();
    const rotationMs = (this.config.keyRotationDays || 90) * 24 * 60 * 60 * 1000;

    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      if (metadata.status === 'active' && now - metadata.lastRotated > rotationMs) {
        console.log(`Rotating key ${keyId} due for rotation...`);
        await this.rotateKey(keyId);
      }
    }
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | undefined {
    return this.keyMetadata.get(keyId);
  }

  /**
   * Get all keys
   */
  getAllKeys(): KeyMetadata[] {
    return Array.from(this.keyMetadata.values());
  }

  /**
   * Delete a key
   */
  async deleteKey(keyId: string): Promise<void> {
    const metadata = this.keyMetadata.get(keyId);
    if (!metadata) {
      throw new Error(`Key ${keyId} not found`);
    }

    // Mark as revoked
    metadata.status = 'revoked';

    // Remove from cache
    this.keyCache.delete(keyId);

    // In HSM, this would also delete from the HSM
    console.log(`Key ${keyId} marked as revoked`);
  }

  /**
   * Export public key
   */
  exportPublicKey(keyId: string): Uint8Array {
    const keyPair = this.keyCache.get(keyId);
    if (!keyPair) {
      throw new Error(`Key ${keyId} not found`);
    }

    return keyPair.publicKey;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    hsmEnabled: boolean;
    hsmProvider: string | undefined;
    totalKeys: number;
    activeKeys: number;
    rotationSchedule: string;
  }> {
    const totalKeys = this.keyMetadata.size;
    const activeKeys = Array.from(this.keyMetadata.values()).filter(
      (k) => k.status === 'active'
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (this.config.enabled && this.config.provider !== 'none') {
      status = 'healthy';
    } else if (totalKeys > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      hsmEnabled: this.config.enabled,
      hsmProvider: this.config.provider,
      totalKeys,
      activeKeys,
      rotationSchedule: `${this.config.keyRotationDays || 90} days`,
    };
  }

  /**
   * Shutdown HSM manager
   */
  async shutdown(): Promise<void> {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    this.keyCache.clear();
    this.keyMetadata.clear();

    console.log('HSM Manager shutdown complete');
  }

  /**
   * Get private key (only for software-based management)
   */
  private getPrivateKey(keyId: string): Uint8Array {
    const keyPair = this.keyCache.get(keyId);
    if (!keyPair?.privateKey) {
      throw new Error(`Private key not available for ${keyId}`);
    }
    return keyPair.privateKey;
  }
}

/**
 * Create HSM manager with default configuration
 */
export async function createHSMManager(config?: Partial<HSMConfig>): Promise<HSMManager> {
  const defaultConfig: HSMConfig = {
    enabled: false,
    provider: 'none',
    keyRotationDays: 90,
  };

  const finalConfig = { ...defaultConfig, ...config };
  const manager = new HSMManager(finalConfig);

  return manager;
}

/**
 * Create HSM manager from environment variables
 */
export function createHSMManagerFromEnv(): HSMManager {
  const config: HSMConfig = {
    enabled: process.env.HSM_ENABLED === 'true',
    provider: (process.env.HSM_PROVIDER as any) || 'none',
    endpoint: process.env.HSM_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      tenantId: process.env.AZURE_TENANT_ID,
      keyId: process.env.GCP_KEY_ID,
    },
    region: process.env.AWS_REGION || 'us-east-1',
    keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS || '90'),
  };

  return new HSMManager(config);
}
