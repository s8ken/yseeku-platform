/**
 * Shared Ed25519 Loader
 *
 * Centralized configuration for @noble/ed25519 v3 with Node.js crypto sha512.
 * This module ensures ed25519 is loaded and configured exactly once.
 */

import { createHash } from 'crypto';

let ed25519Promise: Promise<any> | null = null;

/**
 * Lazily load and configure @noble/ed25519 v3
 *
 * The dynamic import avoids issues with ESM/CJS interop.
 * sha512 is configured using Node.js crypto for compatibility.
 */
export async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = (new Function('return import("@noble/ed25519")')() as Promise<any>).then(
      (ed25519) => {
        // Configure sha512 for @noble/ed25519 v3
        // v3 requires hashes.sha512 to be set (not etc.sha512Sync like v2)
        ed25519.hashes.sha512 = (message: Uint8Array) =>
          new Uint8Array(createHash('sha512').update(message).digest());
        return ed25519;
      }
    );
  }

  return ed25519Promise;
}

/**
 * Generate Ed25519 key pair
 *
 * @returns Object with privateKey and publicKey as Uint8Array
 */
export async function generateEd25519KeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const ed25519 = await loadEd25519();
  // Handle both v2 (randomPrivateKey) and v3 (randomSecretKey) APIs
  const privateKey = (ed25519.utils.randomPrivateKey ?? ed25519.utils.randomSecretKey)();
  const publicKey = await ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Sign a message with Ed25519
 */
export async function signEd25519(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  const ed25519 = await loadEd25519();
  return ed25519.sign(message, privateKey);
}

/**
 * Verify an Ed25519 signature
 */
export async function verifyEd25519(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  const ed25519 = await loadEd25519();
  return ed25519.verify(signature, message, publicKey);
}

/**
 * Get public key from private key
 */
export async function getEd25519PublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
  const ed25519 = await loadEd25519();
  return ed25519.getPublicKey(privateKey);
}
