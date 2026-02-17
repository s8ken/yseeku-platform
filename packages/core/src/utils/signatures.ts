/**
 * Cryptographic Signature Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#signatures
 *
 * Uses Ed25519 for high-performance digital signatures
 */

import {
  loadEd25519,
  generateEd25519KeyPair,
  signEd25519,
  verifyEd25519,
} from './ed25519-loader';

/**
 * Sign a payload with Ed25519 private key
 *
 * @param payload - Data to sign (usually a hash)
 * @param privateKey - Ed25519 private key (32 bytes)
 * @returns Signature as hex string
 */
export async function signPayload(payload: string, privateKey: Uint8Array): Promise<string> {
  const message = Buffer.from(payload, 'utf-8');
  const signature = await signEd25519(message, privateKey);
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
    return await verifyEd25519(sig, message, publicKey);
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
  return generateEd25519KeyPair();
}
