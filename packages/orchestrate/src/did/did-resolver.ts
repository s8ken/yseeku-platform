/**
 * DID Resolver Service
 * 
 * Resolves Decentralized Identifiers (DIDs) to their public keys and metadata
 * 
 * Features:
 * - DID resolution (did:sonate:xyz → public key)
 * - Key version tracking
 * - Active/inactive status
 * - DID creation and lifecycle management
 */

import { createHash, randomBytes } from 'crypto';
import type { DID } from '@sonate/schemas';
import { Logger } from '../observability/logger';

type DIDPublicKey = DID['document']['public_keys'][number];

const logger = new Logger('DIDResolver');

/**
 * In-memory DID store (in production, use persistent database)
 */
const didRegistry = new Map<string, DID>();

/**
 * DIDResolverService
 * 
 * Manages Decentralized Identifiers for agents and users
 */
export class DIDResolverService {
  /**
   * Generate a unique DID identifier
   * 
   * Format: did:sonate:<40-char-random-hash>
   */
  private generateDIDIdentifier(): string {
    const random = randomBytes(20).toString('hex');
    return `did:sonate:${random}`;
  }

  /**
   * Create a new DID with initial public key
   * 
   * @param publicKey - Initial public key (base64)
   * @param keyType - Key type (default: Ed25519)
   * @returns New DID object
   */
  createDID(publicKey: string, keyType: 'Ed25519' = 'Ed25519'): DID {
    const did = this.generateDIDIdentifier();
    const now = new Date().toISOString();

    const didObj: DID = {
      id: did,
      document: {
        public_keys: [
          {
            id: `${did}#key-1`,
            type: keyType,
            value: publicKey,
            created_at: now,
          },
        ],
        created_at: now,
        updated_at: now,
      },
      current_key_version: 'key-1',
      active: true,
    };

    // Store in registry
    didRegistry.set(did, didObj);

    logger.info('DID created', { did, keyVersion: 'key-1' });
    return didObj;
  }

  /**
   * Resolve a DID to get its current public key
   * 
   * @param did - DID identifier
   * @returns Public key and metadata, or null if not found
   */
  resolveDID(
    did: string
  ): {
    publicKey: string;
    keyVersion: string;
    keyType: 'Ed25519';
    createdAt: string;
    isActive: boolean;
  } | null {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      logger.warn('DID not found', { did });
      return null;
    }

    if (!didObj.active) {
      logger.warn('DID is inactive', { did });
      return null;
    }

    // Find current key version
    const currentKeyId = didObj.current_key_version;
    const currentKey = didObj.document.public_keys.find((k: DIDPublicKey) => k.id.endsWith(currentKeyId));

    if (!currentKey) {
      logger.error('Current key not found for DID', { did, keyVersion: currentKeyId });
      return null;
    }

    return {
      publicKey: currentKey.value,
      keyVersion: currentKeyId,
      keyType: currentKey.type,
      createdAt: currentKey.created_at,
      isActive: !currentKey.rotated_at,
    };
  }

  /**
   * Rotate DID key (for security)
   * 
   * @param did - DID identifier
   * @param newPublicKey - New public key (base64)
   * @returns Updated DID object
   */
  rotateKey(did: string, newPublicKey: string): DID | null {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      logger.error('Cannot rotate key: DID not found', { did });
      return null;
    }

    const now = new Date().toISOString();

    // Mark current key as rotated
    const currentKeyIndex = didObj.document.public_keys.findIndex(
      (k: DIDPublicKey) => k.id.endsWith(didObj.current_key_version)
    );

    if (currentKeyIndex >= 0) {
      didObj.document.public_keys[currentKeyIndex].rotated_at = now;
    }

    // Create new key version
    const keyNumber = didObj.document.public_keys.length + 1;
    const newKeyId = `${did}#key-${keyNumber}`;

    didObj.document.public_keys.push({
      id: newKeyId,
      type: 'Ed25519',
      value: newPublicKey,
      created_at: now,
    });

    // Update current version
    didObj.current_key_version = `key-${keyNumber}`;
    didObj.document.updated_at = now;

    logger.info('Key rotated for DID', { did, newKeyVersion: `key-${keyNumber}` });
    return didObj;
  }

  /**
   * Revoke a DID (make it inactive)
   * 
   * @param did - DID identifier
   * @returns Updated DID object
   */
  revokeDID(did: string): DID | null {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      logger.error('Cannot revoke: DID not found', { did });
      return null;
    }

    didObj.active = false;
    didObj.document.updated_at = new Date().toISOString();

    logger.info('DID revoked', { did });
    return didObj;
  }

  /**
   * Get full DID document
   * 
   * @param did - DID identifier
   * @returns Full DID object
   */
  getDIDDocument(did: string): DID | null {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      logger.warn('DID document not found', { did });
      return null;
    }

    return didObj;
  }

  /**
   * Verify a key was issued by a DID
   * 
   * @param did - DID identifier
   * @param publicKey - Public key to verify
   * @returns True if key was ever issued by this DID
   */
  verifyKeyIssuedByDID(did: string, publicKey: string): boolean {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      return false;
    }

    return didObj.document.public_keys.some((k: DIDPublicKey) => k.value === publicKey);
  }

  /**
   * Get key history for a DID (for audit)
   * 
   * @param did - DID identifier
   * @returns List of all keys ever issued
   */
  getKeyHistory(
    did: string
  ): Array<{
    keyId: string;
    createdAt: string;
    rotatedAt?: string;
    isCurrent: boolean;
  }> | null {
    const didObj = didRegistry.get(did);

    if (!didObj) {
      return null;
    }

    return didObj.document.public_keys.map((key: DIDPublicKey) => ({
      keyId: key.id,
      createdAt: key.created_at,
      rotatedAt: key.rotated_at,
      isCurrent: key.id.endsWith(didObj.current_key_version),
    }));
  }

  /**
   * List all DIDs (for debugging/admin)
   * 
   * @returns Array of all DIDs
   */
  listDIDs(): DID[] {
    return Array.from(didRegistry.values());
  }

  /**
   * Clear all DIDs (for testing)
   */
  clearRegistry(): void {
    didRegistry.clear();
    logger.warn('DID registry cleared');
  }
}

/**
 * Singleton instance
 */
let singletonInstance: DIDResolverService | null = null;

export function getDIDResolver(): DIDResolverService {
  if (!singletonInstance) {
    singletonInstance = new DIDResolverService();
  }
  return singletonInstance;
}

export default DIDResolverService;
