"use strict";
/**
 * TrustReceipt - Cryptographically signed interaction records
 *
 * Implements: https://gammatria.com/schemas/trust-receipt
 *
 * Every AI interaction generates a Trust Receipt that is:
 * - Hash-chained (immutable audit trail)
 * - Digitally signed (Ed25519)
 * - Timestamped (Unix ms)
 * - CIQ scored (Clarity, Integrity, Quality)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustReceipt = void 0;
const crypto_1 = require("crypto");
const crypto_advanced_1 = require("./utils/crypto-advanced");
let ed25519Promise = null;
async function loadEd25519() {
    if (!ed25519Promise) {
        ed25519Promise = Promise.all([
            new Function('return import("@noble/ed25519")')(),
            new Function('return import("@noble/hashes/sha512")')(),
        ]).then(([ed25519Mod, hashMod]) => {
            const ed25519 = ed25519Mod.default || ed25519Mod;
            const { sha512 } = hashMod;
            if (ed25519.etc) {
                ed25519.etc.sha512Sync = (...m) => sha512(m[0]);
            }
            return ed25519;
        });
    }
    return ed25519Promise;
}
class TrustReceipt {
    constructor(data) {
        this.version = data.version;
        this.session_id = data.session_id;
        this.timestamp = data.timestamp;
        this.mode = data.mode;
        this.ciq_metrics = data.ciq_metrics;
        this.sonate_trust_receipt = data.sonate_trust_receipt;
        this.previous_hash = data.previous_hash;
        this.session_nonce = data.session_nonce;
        // Calculate hash as per GAMMATRIA spec
        this.self_hash = this.calculateHash();
        this.signature = ''; // Set later with sign()
    }
    /**
     * Calculate SHA-256 hash of payload
     *
     * Algorithm: https://gammatria.com/schemas/trust-receipt#hash-calculation
     * Hash includes: version + session_id + timestamp + mode + ciq_metrics + previous_hash
     */
    calculateHash() {
        const canonical = (0, crypto_advanced_1.canonicalizeJSON)({
            version: this.version,
            session_id: this.session_id,
            timestamp: this.timestamp,
            mode: this.mode,
            ciq_metrics: this.ciq_metrics,
            sonate_trust_receipt: this.sonate_trust_receipt || null,
            previous_hash: this.previous_hash || null,
        }, { method: 'JCS' });
        return (0, crypto_1.createHash)('sha256').update(canonical, 'utf8').digest('hex');
    }
    /**
     * Sign the receipt with Ed25519 private key
     *
     * Algorithm: https://gammatria.com/schemas/trust-receipt#signature
     */
    async sign(privateKey) {
        const messageHash = Buffer.from(this.self_hash, 'hex');
        const ed25519 = await loadEd25519();
        const signature = await ed25519.sign(messageHash, privateKey);
        this.signature = Buffer.from(signature).toString('hex');
    }
    /**
     * Verify signature with Ed25519 public key
     */
    async verify(publicKey) {
        if (!this.signature) {
            return false;
        }
        try {
            const messageHash = Buffer.from(this.self_hash, 'hex');
            const signature = Buffer.from(this.signature, 'hex');
            const ed25519 = await loadEd25519();
            return await ed25519.verify(signature, messageHash, publicKey);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Sign with session binding (self_hash + session_id + session_nonce)
     */
    async signBound(privateKey) {
        const payload = JSON.stringify({
            self_hash: this.self_hash,
            session_id: this.session_id,
            session_nonce: this.session_nonce || '',
        });
        const msg = (0, crypto_1.createHash)('sha256').update(payload).digest();
        const ed25519 = await loadEd25519();
        const signature = await ed25519.sign(msg, privateKey);
        this.signature = Buffer.from(signature).toString('hex');
    }
    /**
     * Verify signature with session binding
     */
    async verifyBound(publicKey) {
        if (!this.signature) {
            return false;
        }
        const payload = JSON.stringify({
            self_hash: this.self_hash,
            session_id: this.session_id,
            session_nonce: this.session_nonce || '',
        });
        const msg = (0, crypto_1.createHash)('sha256').update(payload).digest();
        const signature = Buffer.from(this.signature, 'hex');
        try {
            const ed25519 = await loadEd25519();
            return await ed25519.verify(signature, msg, publicKey);
        }
        catch {
            return false;
        }
    }
    /**
     * Verify hash chain integrity
     * Checks if this receipt correctly chains from previous
     */
    verifyChain(previousReceipt) {
        return this.previous_hash === previousReceipt.self_hash;
    }
    /**
     * Export as JSON (for storage/transmission)
     */
    toJSON() {
        return {
            version: this.version,
            session_id: this.session_id,
            timestamp: this.timestamp,
            mode: this.mode,
            ciq_metrics: this.ciq_metrics,
            sonate_trust_receipt: this.sonate_trust_receipt,
            previous_hash: this.previous_hash,
            self_hash: this.self_hash,
            signature: this.signature,
            session_nonce: this.session_nonce,
        };
    }
    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const receipt = new TrustReceipt({
            version: data.version,
            session_id: data.session_id,
            timestamp: data.timestamp,
            mode: data.mode,
            ciq_metrics: data.ciq_metrics,
            sonate_trust_receipt: data.sonate_trust_receipt,
            previous_hash: data.previous_hash,
            session_nonce: data.session_nonce,
        });
        receipt.signature = data.signature || '';
        return receipt;
    }
}
exports.TrustReceipt = TrustReceipt;
