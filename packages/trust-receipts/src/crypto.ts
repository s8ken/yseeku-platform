/**
 * Cryptographic utilities for Trust Receipts
 *
 * Ed25519 signatures with Node.js crypto sha512.
 * Uses @noble/ed25519 v3 for the actual cryptographic operations.
 */

import { createHash } from 'crypto';

let ed25519Promise: Promise<any> | null = null;

/**
 * Load and configure @noble/ed25519 v3
 */
async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = (new Function('return import("@noble/ed25519")')() as Promise<any>).then(
      (ed25519) => {
        // Configure sha512 for @noble/ed25519 v3
        ed25519.hashes.sha512 = (message: Uint8Array) =>
          new Uint8Array(createHash('sha512').update(message).digest());
        return ed25519;
      }
    );
  }
  return ed25519Promise;
}

/**
 * Generate a new Ed25519 key pair
 *
 * @returns Object with privateKey and publicKey as Uint8Array (32 bytes each)
 *
 * @example
 * ```typescript
 * const { privateKey, publicKey } = await generateKeyPair();
 * console.log('Private key:', Buffer.from(privateKey).toString('hex'));
 * console.log('Public key:', Buffer.from(publicKey).toString('hex'));
 * ```
 */
export async function generateKeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const ed25519 = await loadEd25519();
  const privateKey = (ed25519.utils.randomPrivateKey ?? ed25519.utils.randomSecretKey)();
  const publicKey = await ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Sign a message with Ed25519
 *
 * @param message - The message to sign (Uint8Array)
 * @param privateKey - The 32-byte Ed25519 private key
 * @returns The 64-byte signature
 */
export async function sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const ed25519 = await loadEd25519();
  return ed25519.sign(message, privateKey);
}

/**
 * Verify an Ed25519 signature
 *
 * @param signature - The 64-byte signature to verify
 * @param message - The original message
 * @param publicKey - The 32-byte Ed25519 public key
 * @returns true if valid, false otherwise
 */
export async function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  const ed25519 = await loadEd25519();
  return ed25519.verify(signature, message, publicKey);
}

/**
 * Derive public key from private key
 *
 * @param privateKey - The 32-byte Ed25519 private key
 * @returns The corresponding 32-byte public key
 */
export async function getPublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
  const ed25519 = await loadEd25519();
  return ed25519.getPublicKey(privateKey);
}

/**
 * Compute SHA-256 hash
 *
 * @param data - Data to hash (string or Uint8Array)
 * @returns Hex-encoded hash string
 */
export function sha256(data: string | Uint8Array): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Encode bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Decode hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}
