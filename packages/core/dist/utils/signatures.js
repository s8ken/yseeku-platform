"use strict";
/**
 * Cryptographic Signature Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#signatures
 *
 * Uses Ed25519 for high-performance digital signatures
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
exports.signPayload = signPayload;
exports.verifySignature = verifySignature;
exports.generateKeyPair = generateKeyPair;
const crypto = __importStar(require("crypto"));
let ed25519Promise = null;
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
/**
 * Sign a payload with Ed25519 private key
 *
 * @param payload - Data to sign (usually a hash)
 * @param privateKey - Ed25519 private key (32 bytes)
 * @returns Signature as hex string
 */
async function signPayload(payload, privateKey) {
    const message = Buffer.from(payload, 'utf-8');
    const ed25519 = await loadEd25519();
    const signature = await ed25519.sign(message, privateKey);
    return Buffer.from(signature).toString('hex');
}
/**
 * Verify signature with Ed25519 public key
 *
 * @param signature - Signature as hex string
 * @param payload - Original payload
 * @param publicKey - Ed25519 public key (32 bytes)
 * @returns true if signature is valid
 */
async function verifySignature(signature, payload, publicKey) {
    try {
        const message = Buffer.from(payload, 'utf-8');
        const sig = Buffer.from(signature, 'hex');
        const ed25519 = await loadEd25519();
        return await ed25519.verify(sig, message, publicKey);
    }
    catch (error) {
        return false;
    }
}
/**
 * Generate Ed25519 key pair
 *
 * @returns Object with privateKey and publicKey as Uint8Array
 */
async function generateKeyPair() {
    const ed25519 = await loadEd25519();
    const privateKey = new Uint8Array(crypto.randomBytes(32));
    const publicKey = await ed25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
}
