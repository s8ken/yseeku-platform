/**
 * Hash Chain Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#hash-chaining
 *
 * Creates immutable audit trails by linking receipts via cryptographic hashes
 */

import { createHash } from 'crypto';

/**
 * Calculate hash for hash chain
 *
 * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
 */
export function hashChain(
  previousHash: string,
  payload: string,
  timestamp: number,
  signature: string
): string {
  const combined = `${previousHash}${payload}${timestamp}${signature}`;
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Verify integrity of hash chain
 * Returns true if all receipts are correctly chained
 */
export function verifyHashChain(
  receipts: Array<{ self_hash: string; previous_hash?: string }>
): boolean {
  if (receipts.length === 0) {
    return true;
  }

  for (let i = 1; i < receipts.length; i++) {
    const current = receipts[i];
    const previous = receipts[i - 1];

    if (current.previous_hash !== previous.self_hash) {
      return false;
    }
  }

  return true;
}

/**
 * Generate genesis hash (first in chain)
 */
export function genesisHash(sessionId: string): string {
  return createHash('sha256').update(`genesis_${sessionId}`).digest('hex');
}
