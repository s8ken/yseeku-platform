/**
 * Cryptographic Verification Module
 * Ed25519 and secp256k1 signature verification with canonicalization
 *
 * P0 CRITICAL: Required for pilot
 */

import crypto from 'crypto';

import { canonicalize } from 'json-canonicalize';

export type SignatureAlgorithm = 'Ed25519' | 'ES256K' | 'RS256';

export interface SignatureVerificationResult {
  valid: boolean;
  algorithm: SignatureAlgorithm;
  error?: string;
  verificationMethod?: string;
}

export interface CanonicalizeOptions {
  method: 'JCS' | 'URDNA2015';
}

const sha256Sync = (msg: Uint8Array): Uint8Array =>
  new Uint8Array(crypto.createHash('sha256').update(msg).digest());

let ed25519Promise: Promise<any> | null = null;
let secp256k1Promise: Promise<any> | null = null;

async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = (new Function('return import("@noble/ed25519")')() as Promise<any>).then(
      (ed25519) => {
        (ed25519).etc.sha512Sync = (...m: Uint8Array[]) =>
          new Uint8Array(crypto.createHash('sha512').update(m[0]).digest());
        return ed25519;
      }
    );
  }

  return ed25519Promise;
}

async function loadSecp256k1(): Promise<any> {
  if (!secp256k1Promise) {
    secp256k1Promise = new Function('return import("@noble/secp256k1")')() as Promise<any>;
  }

  return secp256k1Promise;
}

/**
 * Canonicalize JSON for deterministic signing
 * Uses JSON Canonicalization Scheme (JCS) RFC 8785
 */
export function canonicalizeJSON(
  data: any,
  options: CanonicalizeOptions = { method: 'JCS' }
): string {
  if (options.method === 'JCS') {
    return canonicalize(data);
  } 
    // URDNA2015 for RDF - placeholder for future implementation
    throw new Error('URDNA2015 not yet implemented');
  
}

/**
 * Verify Ed25519 signature
 * Used for DID documents and verifiable credentials
 */
export async function verifyEd25519Signature(
  data: any,
  signatureMultibase: string,
  publicKeyMultibase: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
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
  } catch (error) {
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
export async function verifySecp256k1Signature(
  data: any,
  signatureHex: string,
  publicKeyHex: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
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
  } catch (error) {
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
export async function verifyRSASignature(
  data: any,
  signature: string,
  publicKey: string,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
  try {
    // For RSA signatures, we'll need Node.js crypto module

    const canonical = canonicalizeJSON(data, options);
    const message = Buffer.from(canonical, 'utf8');

    const isValid = crypto.verify(
      'sha256',
      message,
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      Buffer.from(signature, 'base64')
    );

    return {
      valid: isValid,
      algorithm: 'RS256',
    };
  } catch (error) {
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
export async function verifyCredentialProof(
  credential: any,
  options?: CanonicalizeOptions
): Promise<SignatureVerificationResult> {
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
      return verifyEd25519Signature(
        credentialWithoutProof,
        proof.proofValue,
        proof.verificationMethod,
        options
      );

    case 'EcdsaSecp256k1Signature2019':
      return verifySecp256k1Signature(
        credentialWithoutProof,
        proof.proofValue,
        proof.verificationMethod,
        options
      );

    case 'RsaSignature2018':
    case 'JsonWebSignature2020':
      return verifyRSASignature(
        credentialWithoutProof,
        proof.jws || proof.proofValue,
        proof.verificationMethod,
        options
      );

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
function base58Decode(encoded: string): Uint8Array {
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
function hexToBytes(hex: string): Uint8Array {
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
export function generateSecureRandom(length: number): Uint8Array {
  // Use Node.js crypto module for secure random generation
  return crypto.randomBytes(length);
}

/**
 * Generate Ed25519 key pair
 */
export async function generateEd25519KeyPair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  const ed25519 = await loadEd25519();
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/**
 * Sign data with Ed25519
 */
export async function signEd25519(data: any, privateKey: Uint8Array): Promise<Uint8Array> {
  const canonical = canonicalizeJSON(data);
  const message = new TextEncoder().encode(canonical);
  const ed25519 = await loadEd25519();
  return await ed25519.sign(message, privateKey);
}

/**
 * Generate crypto-secure API key
 * Replacement for Math.random() based generation
 */
export function generateSecureApiKey(length: number = 64): string {
  const bytes = generateSecureRandom(length);
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Generate nonce for replay protection
 */
export function generateNonce(): string {
  return Buffer.from(generateSecureRandom(16)).toString('base64url');
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks on tokens/secrets
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  // Use Node.js crypto module for timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
