/**
 * Cryptographic Signature Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#signatures
 *
 * Uses Ed25519 for high-performance digital signatures
 */

import * as crypto from 'crypto';

let ed25519Promise: Promise<any> | null = null;

async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = Promise.resolve().then(() => {
      const ed25519 = require('@noble/ed25519');
      ed25519.etc.sha512Sync = (...m: Uint8Array[]) =>
        new Uint8Array(crypto.createHash('sha512').update(m[0]).digest());
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
export async function signPayload(payload: string, privateKey: Uint8Array): Promise<string> {
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
export async function verifySignature(
  signature: string,
  payload: string,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const message = Buffer.from(payload, 'utf-8');
    const sig = Buffer.from(signature, 'hex');
    const ed25519 = await loadEd25519();
    return await ed25519.verify(sig, message, publicKey);
  } catch (error) {
    return false;
  }
}

/**
 * Generate Ed25519 key pair
 *
 * @returns Object with privateKey and publicKey as Uint8Array
 */
export async function generateKeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const ed25519 = await loadEd25519();
  const privateKey = new Uint8Array(crypto.randomBytes(32));
  const publicKey = await ed25519.getPublicKey(privateKey);

  return { privateKey, publicKey };
}
