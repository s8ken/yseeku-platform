"use strict";
/**
 * Hash Chain Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#hash-chaining
 *
 * Creates immutable audit trails by linking receipts via cryptographic hashes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashChain = hashChain;
exports.verifyHashChain = verifyHashChain;
exports.genesisHash = genesisHash;
const crypto_1 = require("crypto");
/**
 * Calculate hash for hash chain
 *
 * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
 */
function hashChain(previousHash, payload, timestamp, signature) {
    const combined = `${previousHash}${payload}${timestamp}${signature}`;
    return (0, crypto_1.createHash)('sha256').update(combined).digest('hex');
}
/**
 * Verify integrity of hash chain
 * Returns true if all receipts are correctly chained
 */
function verifyHashChain(receipts) {
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
function genesisHash(sessionId) {
    return (0, crypto_1.createHash)('sha256').update(`genesis_${sessionId}`).digest('hex');
}
