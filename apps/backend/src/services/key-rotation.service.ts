/**
 * Key Rotation Service
 * 
 * Handles versioned Ed25519 key management with:
 * - Multiple key versions for backward compatibility
 * - Automatic rotation scheduling
 * - Grace period for old keys during transition
 * - Audit logging of key lifecycle events
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

let ed25519Promise: Promise<any> | null = null;

async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = (new Function('return import("@noble/ed25519")')() as Promise<any>).then((ed25519) => {
      const sha512 = (message: Uint8Array) => new Uint8Array(crypto.createHash('sha512').update(message).digest());
      if ((ed25519 as any).hashes) {
        (ed25519 as any).hashes.sha512 = sha512;
      } else {
        (ed25519 as any).etc.sha512Sync = (...m: Uint8Array[]) => sha512(m[0]);
      }
      return ed25519;
    });
  }
  return ed25519Promise;
}

export interface KeyVersion {
  version: string;
  publicKey: string;
  privateKey: string;
  createdAt: string;
  expiresAt: string | null;
  status: 'active' | 'rotating' | 'deprecated' | 'revoked';
  rotatedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface KeyRotationConfig {
  rotationIntervalDays: number;
  gracePeriodDays: number;
  maxActiveVersions: number;
  autoRotate: boolean;
}

export interface SigningResult {
  signature: string;
  keyVersion: string;
  signedAt: string;
}

export interface VerificationResult {
  valid: boolean;
  keyVersion: string;
  keyStatus: string;
  message?: string;
}

const DEFAULT_CONFIG: KeyRotationConfig = {
  rotationIntervalDays: 90,
  gracePeriodDays: 30,
  maxActiveVersions: 3,
  autoRotate: false,
};

class KeyRotationService {
  private keys: Map<string, KeyVersion> = new Map();
  private currentVersion: string | null = null;
  private config: KeyRotationConfig;
  private keysPath: string;
  private initialized: boolean = false;

  constructor(config?: Partial<KeyRotationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.keysPath = process.env.KEY_ROTATION_PATH || path.join(process.cwd(), '.keys', 'key-versions.json');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load from environment (for production with secrets manager)
      if (process.env.TRUST_SIGNING_PRIVATE_KEY && process.env.TRUST_SIGNING_PUBLIC_KEY) {
        const version = process.env.TRUST_SIGNING_KEY_VERSION || 'v1';
        this.keys.set(version, {
          version,
          publicKey: process.env.TRUST_SIGNING_PUBLIC_KEY,
          privateKey: process.env.TRUST_SIGNING_PRIVATE_KEY,
          createdAt: process.env.TRUST_SIGNING_KEY_CREATED || new Date().toISOString(),
          expiresAt: null,
          status: 'active',
        });
        this.currentVersion = version;
        logger.info('Key rotation service initialized from environment', { version });
        this.initialized = true;
        return;
      }

      // Load from file
      if (fs.existsSync(this.keysPath)) {
        const data = JSON.parse(fs.readFileSync(this.keysPath, 'utf-8'));
        
        for (const key of data.keys || []) {
          this.keys.set(key.version, key);
        }
        this.currentVersion = data.currentVersion;
        
        logger.info('Key rotation service loaded from file', { 
          versions: Array.from(this.keys.keys()),
          currentVersion: this.currentVersion 
        });
      } else {
        // Generate initial key
        await this.generateNewVersion();
      }

      this.initialized = true;

      // Check if rotation is needed
      if (this.config.autoRotate) {
        await this.checkRotationNeeded();
      }

    } catch (error) {
      logger.error('Failed to initialize key rotation service', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Generate a new key version
   */
  async generateNewVersion(): Promise<KeyVersion> {
    const ed25519 = await loadEd25519();
    
    // Generate new key pair
    const privateKey = new Uint8Array(crypto.randomBytes(32));
    const publicKey = await ed25519.getPublicKey(privateKey);
    
    const privateKeyHex = Buffer.from(privateKey).toString('hex');
    const publicKeyHex = Buffer.from(publicKey).toString('hex');
    
    // Determine version number
    const existingVersions = Array.from(this.keys.keys())
      .filter(v => v.startsWith('v'))
      .map(v => parseInt(v.slice(1)))
      .filter(n => !isNaN(n));
    const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
    const version = `v${nextVersion}`;
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.config.rotationIntervalDays);
    
    const keyVersion: KeyVersion = {
      version,
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
    };
    
    // Mark old current version as rotating
    if (this.currentVersion && this.keys.has(this.currentVersion)) {
      const oldKey = this.keys.get(this.currentVersion)!;
      oldKey.status = 'rotating';
      oldKey.rotatedAt = now.toISOString();
      this.keys.set(this.currentVersion, oldKey);
    }
    
    this.keys.set(version, keyVersion);
    this.currentVersion = version;
    
    await this.save();
    await this.cleanupOldKeys();
    
    logger.info('Generated new key version', { 
      version, 
      publicKey: publicKeyHex,
      expiresAt: expiresAt.toISOString()
    });
    
    return keyVersion;
  }

  /**
   * Rotate keys - generate new and deprecate old
   */
  async rotate(): Promise<KeyVersion> {
    logger.info('Starting key rotation');
    return this.generateNewVersion();
  }

  /**
   * Check if rotation is needed based on expiration
   */
  async checkRotationNeeded(): Promise<boolean> {
    if (!this.currentVersion) return true;
    
    const currentKey = this.keys.get(this.currentVersion);
    if (!currentKey) return true;
    
    if (!currentKey.expiresAt) return false;
    
    const expiresAt = new Date(currentKey.expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    // Rotate if within 7 days of expiration
    if (daysUntilExpiry <= 7) {
      logger.info('Key approaching expiration, rotation recommended', {
        version: this.currentVersion,
        daysUntilExpiry: Math.round(daysUntilExpiry)
      });
      return true;
    }
    
    return false;
  }

  /**
   * Sign a message with the current key version
   */
  async sign(message: string | Buffer): Promise<SigningResult> {
    if (!this.initialized) await this.initialize();
    
    if (!this.currentVersion) {
      throw new Error('No active signing key');
    }
    
    const keyVersion = this.keys.get(this.currentVersion);
    if (!keyVersion || keyVersion.status === 'revoked') {
      throw new Error('Current key is not available for signing');
    }
    
    const ed25519 = await loadEd25519();
    const privateKey = Buffer.from(keyVersion.privateKey, 'hex');
    
    const messageBytes = typeof message === 'string'
      ? Buffer.from(message, 'utf-8')
      : message;
    
    const signature = await ed25519.sign(messageBytes, new Uint8Array(privateKey));
    
    return {
      signature: Buffer.from(signature).toString('hex'),
      keyVersion: this.currentVersion,
      signedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify a signature, checking against the specified key version
   */
  async verify(
    message: string | Buffer, 
    signature: string, 
    keyVersion?: string
  ): Promise<VerificationResult> {
    if (!this.initialized) await this.initialize();
    
    // If no version specified, try current first, then all active/rotating keys
    const versionsToTry = keyVersion 
      ? [keyVersion] 
      : [this.currentVersion, ...Array.from(this.keys.keys())].filter((v): v is string => v !== null);
    
    for (const version of versionsToTry) {
      const key = this.keys.get(version);
      if (!key) continue;
      
      // Skip revoked keys
      if (key.status === 'revoked') {
        continue;
      }
      
      // Warn if using deprecated key
      if (key.status === 'deprecated') {
        logger.warn('Verifying with deprecated key', { version });
      }
      
      try {
        const ed25519 = await loadEd25519();
        const publicKey = Buffer.from(key.publicKey, 'hex');
        
        const messageBytes = typeof message === 'string'
          ? Buffer.from(message, 'utf-8')
          : message;
        const signatureBytes = Buffer.from(signature, 'hex');
        
        const valid = await ed25519.verify(signatureBytes, messageBytes, new Uint8Array(publicKey));
        
        if (valid) {
          return {
            valid: true,
            keyVersion: version,
            keyStatus: key.status,
          };
        }
      } catch (error) {
        // Continue to next key
      }
    }
    
    return {
      valid: false,
      keyVersion: keyVersion || 'unknown',
      keyStatus: 'unknown',
      message: 'Signature verification failed for all available keys',
    };
  }

  /**
   * Get public key for a specific version (or current)
   */
  async getPublicKey(version?: string): Promise<string> {
    if (!this.initialized) await this.initialize();
    
    const v = version || this.currentVersion;
    if (!v) throw new Error('No key version available');
    
    const key = this.keys.get(v);
    if (!key) throw new Error(`Key version ${v} not found`);
    
    return key.publicKey;
  }

  /**
   * Get current key version
   */
  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  /**
   * List all key versions with their status
   */
  listVersions(): Array<Omit<KeyVersion, 'privateKey'>> {
    return Array.from(this.keys.values()).map(key => ({
      version: key.version,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      status: key.status,
      rotatedAt: key.rotatedAt,
      revokedAt: key.revokedAt,
      revokedReason: key.revokedReason,
    }));
  }

  /**
   * Revoke a specific key version
   */
  async revokeVersion(version: string, reason: string): Promise<void> {
    const key = this.keys.get(version);
    if (!key) {
      throw new Error(`Key version ${version} not found`);
    }
    
    if (version === this.currentVersion) {
      throw new Error('Cannot revoke current active key. Rotate first.');
    }
    
    key.status = 'revoked';
    key.revokedAt = new Date().toISOString();
    key.revokedReason = reason;
    this.keys.set(version, key);
    
    await this.save();
    
    logger.info('Key version revoked', { version, reason });
  }

  /**
   * Cleanup old deprecated keys beyond max versions
   */
  private async cleanupOldKeys(): Promise<void> {
    const sortedKeys = Array.from(this.keys.entries())
      .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime());
    
    let activeCount = 0;
    for (const [version, key] of sortedKeys) {
      if (key.status === 'active' || key.status === 'rotating') {
        activeCount++;
        if (activeCount > this.config.maxActiveVersions) {
          key.status = 'deprecated';
          this.keys.set(version, key);
          logger.info('Key deprecated due to max versions limit', { version });
        }
      }
    }
    
    // Remove very old deprecated keys (older than grace period)
    const gracePeriodMs = this.config.gracePeriodDays * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    
    for (const [version, key] of this.keys.entries()) {
      if (key.status === 'deprecated' && key.rotatedAt) {
        const rotatedAt = new Date(key.rotatedAt).getTime();
        if (now - rotatedAt > gracePeriodMs) {
          this.keys.delete(version);
          logger.info('Old deprecated key removed', { version });
        }
      }
    }
    
    await this.save();
  }

  /**
   * Save keys to file
   */
  private async save(): Promise<void> {
    const keysDir = path.dirname(this.keysPath);
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }
    
    const data = {
      currentVersion: this.currentVersion,
      keys: Array.from(this.keys.values()),
      config: this.config,
      updatedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(this.keysPath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  /**
   * Get rotation status
   */
  async getStatus(): Promise<{
    currentVersion: string | null;
    rotationNeeded: boolean;
    nextRotation: string | null;
    totalVersions: number;
    activeVersions: number;
  }> {
    if (!this.initialized) await this.initialize();
    
    const currentKey = this.currentVersion ? this.keys.get(this.currentVersion) : null;
    const activeVersions = Array.from(this.keys.values()).filter(
      k => k.status === 'active' || k.status === 'rotating'
    ).length;
    
    return {
      currentVersion: this.currentVersion,
      rotationNeeded: await this.checkRotationNeeded(),
      nextRotation: currentKey?.expiresAt || null,
      totalVersions: this.keys.size,
      activeVersions,
    };
  }
}

// Export singleton with default config
export const keyRotationService = new KeyRotationService();

// Export class for custom instances
export { KeyRotationService };
