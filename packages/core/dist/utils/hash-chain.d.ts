/**
 * Hash Chain Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#hash-chaining
 *
 * Creates immutable audit trails by linking receipts via cryptographic hashes
 */
/**
 * Calculate hash for hash chain
 *
 * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
 */
export declare function hashChain(previousHash: string, payload: string, timestamp: number, signature: string): string;
/**
 * Verify integrity of hash chain
 * Returns true if all receipts are correctly chained
 */
export declare function verifyHashChain(receipts: Array<{
    self_hash: string;
    previous_hash?: string;
}>): boolean;
/**
 * Generate genesis hash (first in chain)
 */
export declare function genesisHash(sessionId: string): string;
