/**
 * Key Management Service for Trust Receipt Signing
 *
 * Handles Ed25519 key pair generation, storage, and retrieval
 * for cryptographically signing trust receipts.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { createSecretsManager } from '@sonate/orchestrate';
import { getErrorMessage } from '../utils/error-utils';

let ed25519Promise: Promise<any> | null = null;

async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = (new Function('return import("@noble/ed25519")')() as Promise<any>).then((ed25519) => {
      (ed25519 as any).etc.sha512Sync = (...m: Uint8Array[]) =>
        new Uint8Array(crypto.createHash('sha512').update(m[0]).digest());
      return ed25519;
    });
  }
  return ed25519Promise;
}

interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyHex: string;
}

class KeysService {
  private keyPair: KeyPair | null = null;
  private keysPath: string;
  private initialized: boolean = false;

  constructor() {
    // Store keys in a secure location - can be overridden by env var
    this.keysPath = process.env.TRUST_KEYS_PATH || path.join(process.cwd(), '.keys', 'trust-signing.json');
  }

  /**
   * Initialize the key service - loads or generates keys
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (process.env.SECRETS_PROVIDER === 'vault' && process.env.TRUST_SIGNING_PRIVATE_KEY_REF) {
        const sm = createSecretsManager();
        const privRef = process.env.TRUST_SIGNING_PRIVATE_KEY_REF as string;
        const privHex = await sm.decrypt(privRef);
        const ed25519 = await loadEd25519();
        const clean = (privHex as string).startsWith('0x') ? (privHex as string).slice(2) : (privHex as string);
        const privateKeyBuf = Buffer.from(clean, 'hex');
        const privateKey = new Uint8Array(privateKeyBuf);
        const publicKey = await ed25519.getPublicKey(privateKey);
        const publicKeyHex = Buffer.from(publicKey).toString('hex');
        this.keyPair = {
          privateKey,
          publicKey,
          publicKeyHex,
        };
        logger.info('Trust signing keys loaded from Vault');
        this.initialized = true;
        return;
      }
      // First check environment variables
      if (process.env.TRUST_SIGNING_PRIVATE_KEY && process.env.TRUST_SIGNING_PUBLIC_KEY) {
        const privateKey = Buffer.from(process.env.TRUST_SIGNING_PRIVATE_KEY, 'hex');
        const publicKey = Buffer.from(process.env.TRUST_SIGNING_PUBLIC_KEY, 'hex');

        this.keyPair = {
          privateKey: new Uint8Array(privateKey),
          publicKey: new Uint8Array(publicKey),
          publicKeyHex: process.env.TRUST_SIGNING_PUBLIC_KEY,
        };

        logger.info('Trust signing keys loaded from environment variables');
        this.initialized = true;
        return;
      }

      // Try to load from file
      if (fs.existsSync(this.keysPath)) {
        const data = JSON.parse(fs.readFileSync(this.keysPath, 'utf-8'));
        const privateKey = Buffer.from(data.privateKey, 'hex');
        const publicKey = Buffer.from(data.publicKey, 'hex');

        this.keyPair = {
          privateKey: new Uint8Array(privateKey),
          publicKey: new Uint8Array(publicKey),
          publicKeyHex: data.publicKey,
        };

        logger.info('Trust signing keys loaded from file');
        this.initialized = true;
        return;
      }

      // Generate new keys
      await this.generateNewKeys();
      this.initialized = true;

    } catch (error: unknown) {
      logger.error('Failed to initialize keys service', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Generate a new Ed25519 key pair
   */
  async generateNewKeys(): Promise<{ publicKey: string; privateKey: string }> {
    const ed25519 = await loadEd25519();

    // Generate random 32-byte private key
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);

    const privateKeyHex = Buffer.from(privateKey).toString('hex');
    const publicKeyHex = Buffer.from(publicKey).toString('hex');

    this.keyPair = {
      privateKey,
      publicKey,
      publicKeyHex,
    };

    // Save to file
    const keysDir = path.dirname(this.keysPath);
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    fs.writeFileSync(this.keysPath, JSON.stringify({
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      generatedAt: new Date().toISOString(),
    }, null, 2), { mode: 0o600 }); // Restrict file permissions

    logger.info('Generated new trust signing keys', { publicKey: publicKeyHex });

    return { publicKey: publicKeyHex, privateKey: privateKeyHex };
  }

  /**
   * Get the private key for signing
   */
  async getPrivateKey(): Promise<Uint8Array> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.keyPair) {
      throw new Error('Keys not initialized');
    }

    return this.keyPair.privateKey;
  }

  /**
   * Get the public key for verification
   */
  async getPublicKey(): Promise<Uint8Array> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.keyPair) {
      throw new Error('Keys not initialized');
    }

    return this.keyPair.publicKey;
  }

  /**
   * Get the public key as hex string (for display/sharing)
   */
  async getPublicKeyHex(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.keyPair) {
      throw new Error('Keys not initialized');
    }

    return this.keyPair.publicKeyHex;
  }

  /**
   * Sign a message using Ed25519
   */
  async sign(message: string | Buffer): Promise<string> {
    const ed25519 = await loadEd25519();
    const privateKey = await this.getPrivateKey();

    const messageBytes = typeof message === 'string'
      ? Buffer.from(message, 'hex')
      : message;

    const signature = await ed25519.sign(messageBytes, privateKey);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify a signature using Ed25519
   */
  async verify(message: string | Buffer, signature: string, publicKey?: Uint8Array): Promise<boolean> {
    try {
      const ed25519 = await loadEd25519();
      const pubKey = publicKey || await this.getPublicKey();

      const messageBytes = typeof message === 'string'
        ? Buffer.from(message, 'hex')
        : message;
      const signatureBytes = Buffer.from(signature, 'hex');

      return await ed25519.verify(signatureBytes, messageBytes, pubKey);
    } catch (error) {
      logger.error('Signature verification failed', { error });
      return false;
    }
  }

  /**
   * Check if keys are initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.keyPair !== null;
  }
}

// Export singleton
export const keysService = new KeysService();
