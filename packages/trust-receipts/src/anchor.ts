/**
 * OpenTimestamps Anchoring
 *
 * Optional module for anchoring receipt hashes to Bitcoin via OpenTimestamps.
 * This provides stronger timestamp guarantees through blockchain immutability.
 *
 * Usage:
 * ```typescript
 * import { TrustReceipts } from '@sonate/trust-receipts';
 * import { anchor, verifyAnchor } from '@sonate/trust-receipts/anchor';
 *
 * const { receipt } = await receipts.wrap(...);
 * const proof = await anchor(receipt.receiptHash);
 *
 * // Later, verify the anchor
 * const verified = await verifyAnchor(receipt.receiptHash, proof);
 * ```
 */

import { hexToBytes } from './crypto';

/**
 * OpenTimestamps calendar server URLs
 */
const CALENDAR_URLS = [
  'https://a.pool.opentimestamps.org',
  'https://b.pool.opentimestamps.org',
  'https://alice.btc.calendar.opentimestamps.org',
  'https://bob.btc.calendar.opentimestamps.org',
];

/**
 * Anchor proof containing the OpenTimestamps data
 */
export interface AnchorProof {
  /** The hash that was anchored */
  hash: string;
  /** ISO timestamp when anchoring was submitted */
  submittedAt: string;
  /** Calendar servers that accepted the submission */
  calendars: string[];
  /** Base64-encoded OTS proof (pending until Bitcoin confirmation) */
  otsProof: string;
  /** Status: pending (waiting for Bitcoin), confirmed (in blockchain) */
  status: 'pending' | 'confirmed';
  /** Bitcoin block height (if confirmed) */
  bitcoinBlock?: number;
  /** Bitcoin transaction ID (if confirmed) */
  bitcoinTxId?: string;
}

/**
 * Submit a hash to OpenTimestamps calendar servers
 *
 * The returned proof is initially "pending" - it takes ~1-2 hours for
 * the hash to be included in a Bitcoin block. Use upgradeAnchor() to
 * check for confirmation.
 *
 * @param hash - SHA-256 hash (hex string) to anchor
 * @param options - Optional configuration
 * @returns Anchor proof (pending)
 */
export async function anchor(
  hash: string,
  options: { calendars?: string[]; timeout?: number } = {}
): Promise<AnchorProof> {
  const calendars = options.calendars ?? CALENDAR_URLS;
  const timeout = options.timeout ?? 10000;

  const hashBytes = hexToBytes(hash);
  const successfulCalendars: string[] = [];
  const proofs: Uint8Array[] = [];

  // Submit to multiple calendars for redundancy
  const submissions = calendars.map(async (calendarUrl) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${calendarUrl}/digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/vnd.opentimestamps.v1',
        },
        body: Buffer.from(hashBytes),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const proofData = await response.arrayBuffer();
        successfulCalendars.push(calendarUrl);
        proofs.push(new Uint8Array(proofData));
      }
    } catch {
      // Calendar unavailable, continue with others
    }
  });

  await Promise.allSettled(submissions);

  if (successfulCalendars.length === 0) {
    throw new Error('Failed to submit to any OpenTimestamps calendar');
  }

  // Combine proofs (use first successful one for now)
  const combinedProof = proofs[0];
  const otsProof = Buffer.from(combinedProof).toString('base64');

  return {
    hash,
    submittedAt: new Date().toISOString(),
    calendars: successfulCalendars,
    otsProof,
    status: 'pending',
  };
}

/**
 * Check if an anchor has been confirmed in Bitcoin
 *
 * Call this periodically (e.g., hourly) to upgrade pending proofs.
 *
 * @param proof - The anchor proof to check
 * @returns Updated proof with confirmation status
 */
export async function upgradeAnchor(proof: AnchorProof): Promise<AnchorProof> {
  if (proof.status === 'confirmed') {
    return proof;
  }

  // Try each calendar to get upgraded proof
  for (const calendarUrl of proof.calendars) {
    try {
      const proofBytes = Buffer.from(proof.otsProof, 'base64');

      const response = await fetch(`${calendarUrl}/timestamp/${proof.hash}`, {
        headers: {
          Accept: 'application/vnd.opentimestamps.v1',
        },
      });

      if (response.ok) {
        const upgradedData = await response.arrayBuffer();
        const upgradedProof = new Uint8Array(upgradedData);

        // Check if proof contains Bitcoin attestation
        // (simplified check - full verification requires parsing OTS format)
        if (upgradedProof.length > proofBytes.length) {
          return {
            ...proof,
            otsProof: Buffer.from(upgradedProof).toString('base64'),
            status: 'confirmed',
          };
        }
      }
    } catch {
      // Continue with next calendar
    }
  }

  return proof;
}

/**
 * Verify that a hash matches an anchor proof
 *
 * Note: This verifies the hash matches the proof, but full Bitcoin
 * verification requires parsing the OTS format and checking the
 * blockchain. For full verification, use the opentimestamps CLI
 * or library.
 *
 * @param hash - The hash to verify
 * @param proof - The anchor proof
 * @returns true if hash matches the anchored hash
 */
export function verifyAnchor(hash: string, proof: AnchorProof): boolean {
  return hash === proof.hash;
}

/**
 * Anchor a chain of receipts (anchors the final receipt hash)
 *
 * Since receipts are hash-chained, anchoring the last receipt
 * transitively anchors the entire chain.
 *
 * @param receiptHashes - Array of receipt hashes in order
 * @returns Anchor proof for the chain
 */
export async function anchorChain(receiptHashes: string[]): Promise<AnchorProof> {
  if (receiptHashes.length === 0) {
    throw new Error('Cannot anchor empty chain');
  }

  // Anchor the last receipt (which transitively anchors the whole chain)
  const lastHash = receiptHashes[receiptHashes.length - 1];
  const proof = await anchor(lastHash);

  return {
    ...proof,
    // Include chain length in proof for reference
    hash: lastHash,
  };
}
