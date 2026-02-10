"use strict";
/**
 * Cryptographic Verification Module
 * Ed25519 and secp256k1 signature verification with canonicalization
 *
 * P0 CRITICAL: Required for pilot
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizeJSON = canonicalizeJSON;
exports.verifyEd25519Signature = verifyEd25519Signature;
exports.verifySecp256k1Signature = verifySecp256k1Signature;
exports.verifyRSASignature = verifyRSASignature;
exports.verifyCredentialProof = verifyCredentialProof;
exports.generateSecureRandom = generateSecureRandom;
exports.generateEd25519KeyPair = generateEd25519KeyPair;
exports.signEd25519 = signEd25519;
exports.generateSecureApiKey = generateSecureApiKey;
exports.generateNonce = generateNonce;
exports.timingSafeEqual = timingSafeEqual;
const crypto = __importStar(require("crypto"));
const json_canonicalize_1 = require("json-canonicalize");
const sha256Sync = (msg) => new Uint8Array(crypto.createHash('sha256').update(msg).digest());
let ed25519Promise = null;
let secp256k1Promise = null;
async function loadEd25519() {
    if (!ed25519Promise) {
        ed25519Promise = Promise.all([
            new Function('return import("@noble/ed25519")')(),
            new Function('return import("@noble/hashes/sha2.js")')(),
        ]).then(([ed25519Mod, hashMod]) => {
            const ed25519 = ed25519Mod.default || ed25519Mod;
            const { sha512 } = hashMod;
            if (ed25519.hashes) {
                ed25519.hashes.sha512 = sha512;
            }
            else if (ed25519.etc) {
                ed25519.etc.sha512Sync = (...m) => sha512(m[0]);
            }
            return ed25519;
        });
    }
    return ed25519Promise;
}
async function loadSecp256k1() {
    if (!secp256k1Promise) {
        secp256k1Promise = new Function('return import("@noble/secp256k1")')();
    }
    return secp256k1Promise;
}
/**
 * Canonicalize JSON for deterministic signing
 * Uses JSON Canonicalization Scheme (JCS) RFC 8785
 */
function canonicalizeJSON(data, options = { method: 'JCS' }) {
    if (options.method === 'JCS') {
        return (0, json_canonicalize_1.canonicalize)(data);
    }
    // URDNA2015 for RDF - placeholder for future implementation
    throw new Error('URDNA2015 not yet implemented');
}
/**
 * Verify Ed25519 signature
 * Used for DID documents and verifiable credentials
 */
async function verifyEd25519Signature(data, signatureMultibase, publicKeyMultibase, options) {
    try {
        // Canonicalize the data
        const canonical = canonicalizeJSON(data, options);
        const message = new TextEncoder().encode(canonical);
        // Decode multibase (assuming 'z' prefix for base58btc)
        if (!signatureMultibase.startsWith('z') || !publicKeyMultibase.startsWith('z')) {
            return {
                valid: false,
                algorithm: 'Ed25519',
                error: 'Invalid multibase encoding (expected base58btc with z prefix)',
            };
        }
        // Remove 'z' prefix and decode base58
        const signature = base58Decode(signatureMultibase.substring(1));
        const publicKey = base58Decode(publicKeyMultibase.substring(1));
        // Ed25519 verification using noble library
        const ed25519 = await loadEd25519();
        const isValid = await ed25519.verify(signature, message, publicKey);
        return {
            valid: isValid,
            algorithm: 'Ed25519',
        };
    }
    catch (error) {
        return {
            valid: false,
            algorithm: 'Ed25519',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Verify secp256k1 signature (for Ethereum DIDs)
 * ES256K algorithm
 */
async function verifySecp256k1Signature(data, signatureHex, publicKeyHex, options) {
    try {
        // Canonicalize the data
        const canonical = canonicalizeJSON(data, options);
        const message = new TextEncoder().encode(canonical);
        // Hash the message with SHA-256 (ES256K uses SHA-256)
        const hash = sha256Sync(message);
        // Decode signature and public key (hex format for Ethereum)
        const signature = hexToBytes(signatureHex);
        const publicKey = hexToBytes(publicKeyHex);
        // secp256k1 verification using noble library
        const secp256k1 = await loadSecp256k1();
        const isValid = await secp256k1.verify(signature, hash, publicKey);
        return {
            valid: isValid,
            algorithm: 'ES256K',
        };
    }
    catch (error) {
        return {
            valid: false,
            algorithm: 'ES256K',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Verify RSA signature (RS256)
 * For backward compatibility with JWT systems
 */
async function verifyRSASignature(data, signature, publicKey, options) {
    try {
        // For RSA signatures, we'll need Node.js crypto module
        const canonical = canonicalizeJSON(data, options);
        const message = Buffer.from(canonical, 'utf8');
        const isValid = crypto.verify('sha256', message, {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
        }, Buffer.from(signature, 'base64'));
        return {
            valid: isValid,
            algorithm: 'RS256',
        };
    }
    catch (error) {
        return {
            valid: false,
            algorithm: 'RS256',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Verify a verifiable credential proof
 */
async function verifyCredentialProof(credential, options) {
    if (!credential.proof) {
        return {
            valid: false,
            algorithm: 'Ed25519',
            error: 'No proof found in credential',
        };
    }
    const proof = credential.proof;
    // Create a copy without the proof for verification
    const credentialWithoutProof = { ...credential };
    delete credentialWithoutProof.proof;
    // Determine algorithm from proof type
    switch (proof.type) {
        case 'Ed25519Signature2020':
            return verifyEd25519Signature(credentialWithoutProof, proof.proofValue, proof.verificationMethod, options);
        case 'EcdsaSecp256k1Signature2019':
            return verifySecp256k1Signature(credentialWithoutProof, proof.proofValue, proof.verificationMethod, options);
        case 'RsaSignature2018':
        case 'JsonWebSignature2020':
            return verifyRSASignature(credentialWithoutProof, proof.jws || proof.proofValue, proof.verificationMethod, options);
        default:
            return {
                valid: false,
                algorithm: 'Ed25519',
                error: `Unsupported proof type: ${proof.type}`,
            };
    }
}
/**
 * Base58 decoding (Bitcoin alphabet)
 * Used for multibase 'z' prefix
 */
function base58Decode(encoded) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = BigInt(58);
    let result = BigInt(0);
    for (let i = 0; i < encoded.length; i++) {
        const digit = ALPHABET.indexOf(encoded[i]);
        if (digit < 0) {
            throw new Error(`Invalid base58 character: ${encoded[i]}`);
        }
        result = result * base + BigInt(digit);
    }
    // Convert to Uint8Array
    const hex = result.toString(16);
    const paddedHex = hex.length % 2 ? '0' + hex : hex;
    return hexToBytes(paddedHex);
}
/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}
/**
 * Generate crypto-secure random bytes
 * Use this instead of Math.random() for keys/nonces
 */
function generateSecureRandom(length) {
    // Use Node.js crypto module for secure random generation
    return crypto.randomBytes(length);
}
/**
 * Generate Ed25519 key pair
 */
async function generateEd25519KeyPair() {
    const ed25519 = await loadEd25519();
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
}
/**
 * Sign data with Ed25519
 */
async function signEd25519(data, privateKey) {
    const canonical = canonicalizeJSON(data);
    const message = new TextEncoder().encode(canonical);
    const ed25519 = await loadEd25519();
    return await ed25519.sign(message, privateKey);
}
/**
 * Generate crypto-secure API key
 * Replacement for Math.random() based generation
 */
function generateSecureApiKey(length = 64) {
    const bytes = generateSecureRandom(length);
    return Buffer.from(bytes).toString('base64url');
}
/**
 * Generate nonce for replay protection
 */
function generateNonce() {
    return Buffer.from(generateSecureRandom(16)).toString('base64url');
}
/**
 * Timing-safe string comparison
 * Prevents timing attacks on tokens/secrets
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    // Use Node.js crypto module for timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
