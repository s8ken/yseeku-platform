/**
 * SONATE Verify SDK
 * 
 * Client-side SDK for verifying trust receipts in Node.js and browsers.
 * Zero backend calls required - cryptographic verification is local.
 * 
 * @example
 * ```typescript
 * import { verify, fetchPublicKey } from '@sonate/verify-sdk';
 * 
 * const publicKey = await fetchPublicKey();
 * const result = await verify(receipt, publicKey);
 * 
 * if (result.valid) {
 *   console.log('Trust score:', result.trustScore);
 * }
 * ```
 */

// Use Web Crypto API for browser compatibility
const isBrowser = typeof window !== 'undefined';

export interface TrustReceipt {
  self_hash?: string;
  timestamp?: number | string;
  session_id?: string;
  agent_id?: string;
  interaction?: {
    prompt?: string;
    response?: string;
  };
  ciq_metrics?: {
    clarity?: number;
    integrity?: number;
    quality?: number;
  };
  trust_score?: number;
  chain?: {
    previous_hash?: string;
    chain_hash?: string;
    chain_length?: number;
  };
  previous_hash?: string;
  signature?: string | {
    algorithm?: string;
    value?: string;
    key_version?: string;
  };
  proof?: {
    type?: string;
    proofValue?: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  checks: {
    structure: { passed: boolean; message: string };
    signature: { passed: boolean; message: string };
    chain: { passed: boolean; message: string };
    timestamp: { passed: boolean; message: string };
  };
  trustScore: number | null;
  errors: string[];
  receipt: TrustReceipt;
}

export interface PublicKeyInfo {
  publicKey: string;
  algorithm: string;
  format: string;
  keyId?: string;
}

// Default SONATE public key endpoint
const DEFAULT_PUBKEY_URL = 'https://yseeku-backend.fly.dev/api/public-demo/public-key';

/**
 * Fetch the SONATE platform public key
 */
export async function fetchPublicKey(url?: string): Promise<string> {
  const response = await fetch(url || DEFAULT_PUBKEY_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch public key: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.publicKey || data.publicKey;
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash (browser-compatible)
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  if (isBrowser && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(hashBuffer));
  } else {
    // Node.js fallback
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(message).digest('hex');
  }
}

/**
 * Verify Ed25519 signature (browser-compatible)
 */
async function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    // Try @noble/ed25519 first (works in both environments)
    const ed = await import('@noble/ed25519');
    
    // Configure sha512 for @noble/ed25519
    if ((ed as any).etc?.sha512Sync === undefined) {
      if (isBrowser && crypto.subtle) {
        // Browser: use crypto.subtle
        (ed as any).etc = (ed as any).etc || {};
        (ed as any).etc.sha512Sync = undefined;
        (ed as any).etc.sha512Async = async (message: Uint8Array) => {
          const hashBuffer = await crypto.subtle.digest('SHA-512', message);
          return new Uint8Array(hashBuffer);
        };
      } else {
        // Node.js: use crypto module
        const nodeCrypto = await import('crypto');
        (ed as any).etc = (ed as any).etc || {};
        (ed as any).etc.sha512Sync = (...m: Uint8Array[]) => 
          new Uint8Array(nodeCrypto.createHash('sha512').update(m[0]).digest());
      }
    }
    
    return await ed.verifyAsync(signature, message, publicKey);
  } catch (error) {
    console.error('Ed25519 verification error:', error);
    return false;
  }
}

/**
 * Canonicalize object for signing (deterministic JSON)
 */
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys
    .filter(key => obj[key] !== undefined)
    .map(key => `"${key}":${canonicalize(obj[key])}`);
  
  return '{' + pairs.join(',') + '}';
}

/**
 * Verify a SONATE trust receipt
 * 
 * @param receipt - The trust receipt to verify
 * @param publicKey - The SONATE public key (hex string)
 * @returns Verification result with detailed checks
 */
export async function verify(
  receipt: TrustReceipt,
  publicKey: string
): Promise<VerificationResult> {
  const result: VerificationResult = {
    valid: false,
    checks: {
      structure: { passed: false, message: '' },
      signature: { passed: false, message: '' },
      chain: { passed: false, message: '' },
      timestamp: { passed: false, message: '' },
    },
    trustScore: null,
    errors: [],
    receipt,
  };

  try {
    // 1. Structure validation
    if (!receipt.self_hash && !receipt.signature) {
      result.checks.structure.message = 'Missing required fields (self_hash or signature)';
      result.errors.push(result.checks.structure.message);
    } else {
      result.checks.structure.passed = true;
      result.checks.structure.message = 'Valid receipt structure';
    }

    // 2. Signature verification
    const signatureValue = typeof receipt.signature === 'string'
      ? receipt.signature
      : receipt.signature?.value || receipt.proof?.proofValue;

    if (signatureValue && publicKey) {
      // Build content for verification (same as signing)
      const receiptForVerify = {
        ...receipt,
        signature: undefined,
        proof: undefined,
      };
      
      // If chain_hash exists, set it to empty for verification
      if (receiptForVerify.chain?.chain_hash) {
        receiptForVerify.chain = {
          ...receiptForVerify.chain,
          chain_hash: '',
        };
      }

      const canonical = canonicalize(receiptForVerify);
      const messageBytes = new TextEncoder().encode(canonical);
      const signatureBytes = hexToBytes(signatureValue);
      const publicKeyBytes = hexToBytes(publicKey);

      const isValid = await verifyEd25519(messageBytes, signatureBytes, publicKeyBytes);
      
      result.checks.signature.passed = isValid;
      result.checks.signature.message = isValid 
        ? 'Ed25519 signature verified' 
        : 'Signature verification failed';
      
      if (!isValid) {
        result.errors.push('Signature verification failed');
      }
    } else {
      result.checks.signature.message = 'No signature or public key provided';
      result.errors.push(result.checks.signature.message);
    }

    // 3. Chain hash verification
    const previousHash = receipt.chain?.previous_hash || receipt.previous_hash || '';
    const chainHash = receipt.chain?.chain_hash;

    if (chainHash && receipt.self_hash) {
      // Verify chain hash
      const chainContent = receipt.self_hash + previousHash;
      const expectedChainHash = await sha256(chainContent);
      
      const chainValid = expectedChainHash === chainHash;
      result.checks.chain.passed = chainValid;
      result.checks.chain.message = chainValid
        ? 'Chain hash verified'
        : 'Chain hash mismatch';
      
      if (!chainValid) {
        result.errors.push('Chain hash verification failed');
      }
    } else if (receipt.chain?.chain_length === 1 || !previousHash) {
      // First receipt in chain
      result.checks.chain.passed = true;
      result.checks.chain.message = 'First receipt in chain (no previous hash)';
    } else {
      result.checks.chain.passed = true;
      result.checks.chain.message = 'Chain verification skipped (no chain_hash)';
    }

    // 4. Timestamp validation
    const timestamp = receipt.timestamp;
    if (timestamp) {
      const receiptTime = typeof timestamp === 'number' 
        ? new Date(timestamp)
        : new Date(timestamp);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      if (receiptTime > fiveMinutesAgo && receiptTime < oneYearFromNow) {
        result.checks.timestamp.passed = true;
        result.checks.timestamp.message = 'Timestamp within valid range';
      } else {
        result.checks.timestamp.passed = false;
        result.checks.timestamp.message = 'Timestamp outside valid range';
        result.errors.push(result.checks.timestamp.message);
      }
    } else {
      result.checks.timestamp.passed = true;
      result.checks.timestamp.message = 'No timestamp to validate';
    }

    // Calculate trust score
    if (receipt.trust_score !== undefined) {
      result.trustScore = receipt.trust_score;
    } else if (receipt.ciq_metrics) {
      const { clarity = 0, integrity = 0, quality = 0 } = receipt.ciq_metrics;
      result.trustScore = Math.round(((clarity + integrity + quality) / 3) * 100);
    }

    // Overall validity
    result.valid = 
      result.checks.structure.passed &&
      result.checks.signature.passed &&
      result.checks.chain.passed &&
      result.checks.timestamp.passed;

  } catch (error) {
    result.errors.push(`Verification error: ${error}`);
  }

  return result;
}

/**
 * Quick verification - returns boolean only
 */
export async function quickVerify(
  receipt: TrustReceipt,
  publicKey: string
): Promise<boolean> {
  const result = await verify(receipt, publicKey);
  return result.valid;
}

/**
 * Verify a batch of receipts
 */
export async function verifyBatch(
  receipts: TrustReceipt[],
  publicKey: string
): Promise<{
  total: number;
  valid: number;
  invalid: number;
  results: VerificationResult[];
}> {
  const results = await Promise.all(
    receipts.map(receipt => verify(receipt, publicKey))
  );

  return {
    total: receipts.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    results,
  };
}

/**
 * Calculate trust score from CIQ metrics
 */
export function calculateTrustScore(ciqMetrics: {
  clarity?: number;
  integrity?: number;
  quality?: number;
}): number {
  const { clarity = 0, integrity = 0, quality = 0 } = ciqMetrics;
  return Math.round(((clarity + integrity + quality) / 3) * 100);
}

/**
 * Check if a receipt is from a trusted issuer
 */
export function isTrustedIssuer(receipt: TrustReceipt, trustedIssuers: string[]): boolean {
  const issuer = (receipt as any).issuer;
  if (!issuer) return false;
  
  const issuerId = typeof issuer === 'string' ? issuer : issuer.id;
  return trustedIssuers.some(trusted => 
    issuerId === trusted || issuerId.startsWith(trusted)
  );
}

// Export types
export type { TrustReceipt, VerificationResult, PublicKeyInfo };
