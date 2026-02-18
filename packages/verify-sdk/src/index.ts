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
 *   console.log('All checks passed');
 * }
 * ```
 */

// Use Web Crypto API for browser compatibility
const isBrowser = typeof window !== 'undefined';

export interface TrustReceipt {
  /** V2 receipt ID (SHA-256 hash of canonical content) */
  id: string;
  /** Receipt schema version */
  version: '2.0.0';
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Session identifier */
  session_id: string;
  /** DID of the AI agent */
  agent_did: string;
  /** DID of the human user */
  human_did: string;
  /** Policy version */
  policy_version?: string;
  /** Governance mode */
  mode: 'constitutional' | 'directive';
  /** AI interaction data */
  interaction: {
    prompt?: string;
    response?: string;
    prompt_hash?: string;
    response_hash?: string;
    model: string;
    provider?: string;
    temperature?: number;
    max_tokens?: number;
    reasoning?: {
      thought_process?: string;
      confidence?: number;
      retrieved_context?: string[];
    };
  };
  /** Trust metrics */
  telemetry?: {
    resonance_score?: number;
    resonance_quality?: string;
    bedau_index?: number;
    coherence_score?: number;
    truth_debt?: number;
    volatility?: number;
    ciq_metrics?: {
      clarity?: number;
      integrity?: number;
      quality?: number;
    };
  };
  /** Policy state */
  policy_state?: Record<string, any>;
  /** Hash chain for immutability */
  chain: {
    previous_hash: string;
    chain_hash: string;
    chain_length?: number;
  };
  /** Cryptographic signature */
  signature: {
    algorithm: 'Ed25519';
    value: string;
    key_version: string;
    timestamp_signed?: string;
    public_key?: string;
  };
  /** Optional metadata */
  metadata?: Record<string, any>;

  // Deprecated V1 fields (for backwards compat detection)
  /** @deprecated Use `id` instead */
  self_hash?: string;
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
    // Use @noble/ed25519 (works in both environments)
    const ed = await import('@noble/ed25519');

    // Configure sha512 for @noble/ed25519
    if (ed.etc && !ed.etc.sha512Sync) {
      if (isBrowser && crypto.subtle) {
        // Browser: use crypto.subtle via async
        ed.etc.sha512Async = async (message: Uint8Array) => {
          const hashBuffer = await crypto.subtle.digest('SHA-512', new Uint8Array(message));
          return new Uint8Array(hashBuffer);
        };
      } else {
        // Node.js: use crypto module
        const nodeCrypto = await import('crypto');
        ed.etc.sha512Sync = (...m: Uint8Array[]) =>
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
 *
 * CRITICAL: This function MUST produce identical output to:
 * - receipt-generator.ts canonicalize()
 * - public-demo.routes.ts canonicalize()
 *
 * Rules:
 * - Recursively sort keys at every nesting level
 * - Filter out undefined values
 * - Arrays preserve order
 */
export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys
    .filter(key => obj[key] !== undefined)
    .map(key => JSON.stringify(key) + ':' + canonicalize(obj[key]));

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
    // 1. Structure validation (V2-only: require `id`)
    const receiptId = receipt.id || receipt.self_hash;
    if (!receiptId || !receipt.signature?.value) {
      const missing = [];
      if (!receiptId) missing.push('id');
      if (!receipt.signature?.value) missing.push('signature');
      result.checks.structure.message = `Missing required fields: ${missing.join(', ')}`;
      result.errors.push(result.checks.structure.message);

      if (receipt.self_hash && !receipt.id) {
        result.checks.structure.message = 'This receipt uses V1 format (self_hash). V2 format with "id" field is required.';
        result.errors.push(result.checks.structure.message);
      }
    } else {
      result.checks.structure.passed = true;
      result.checks.structure.message = 'Valid V2 receipt structure';
    }

    // 2. Signature verification - sign over canonical receipt content (without signature)
    const signatureValue = receipt.signature?.value;

    if (signatureValue && publicKey) {
      const { signature: _sig, ...receiptWithoutSig } = receipt;
      const canonical = canonicalize(receiptWithoutSig);
      const messageBytes = new TextEncoder().encode(canonical);
      const signatureBytes = hexToBytes(signatureValue);
      const publicKeyBytes = hexToBytes(publicKey);

      const isValid = await verifyEd25519(messageBytes, signatureBytes, publicKeyBytes);

      result.checks.signature.passed = isValid;
      result.checks.signature.message = isValid
        ? 'Ed25519 signature verified'
        : 'Signature verification failed - content may have been tampered';

      if (!isValid) {
        result.errors.push('Signature verification failed');
      }
    } else {
      result.checks.signature.message = 'No signature or public key provided';
      result.errors.push(result.checks.signature.message);
    }

    // 3. Chain hash verification
    if (receipt.chain?.chain_hash && receipt.chain?.previous_hash) {
      // Reconstruct: canonicalize(receipt without sig, with empty chain_hash) + previous_hash
      const { signature: _sig, ...receiptWithoutSig } = receipt;
      const receiptForChain = {
        ...receiptWithoutSig,
        chain: { ...receipt.chain, chain_hash: '' },
      };
      const contentForChain = canonicalize(receiptForChain);
      const chainContent = contentForChain + receipt.chain.previous_hash;
      const expectedChainHash = await sha256(chainContent);

      const chainValid = expectedChainHash === receipt.chain.chain_hash;
      result.checks.chain.passed = chainValid;
      result.checks.chain.message = chainValid
        ? 'Chain hash verified'
        : 'Chain hash mismatch - receipt may have been tampered';

      if (!chainValid) {
        result.errors.push('Chain hash verification failed');
      }
    } else if (receipt.chain?.previous_hash === 'GENESIS') {
      // First receipt in chain - chain hash should still be present and valid
      if (receipt.chain?.chain_hash) {
        const { signature: _sig, ...receiptWithoutSig } = receipt;
        const receiptForChain = {
          ...receiptWithoutSig,
          chain: { ...receipt.chain, chain_hash: '' },
        };
        const contentForChain = canonicalize(receiptForChain);
        const chainContent = contentForChain + 'GENESIS';
        const expectedChainHash = await sha256(chainContent);

        const chainValid = expectedChainHash === receipt.chain.chain_hash;
        result.checks.chain.passed = chainValid;
        result.checks.chain.message = chainValid
          ? 'Genesis chain hash verified'
          : 'Genesis chain hash mismatch';
        if (!chainValid) {
          result.errors.push('Genesis chain hash verification failed');
        }
      } else {
        result.checks.chain.passed = true;
        result.checks.chain.message = 'First receipt in chain (GENESIS)';
      }
    } else {
      result.checks.chain.passed = true;
      result.checks.chain.message = 'Chain verification skipped (no chain data)';
    }

    // 4. Timestamp validation
    const timestamp = receipt.timestamp;
    if (timestamp) {
      const receiptTime = new Date(timestamp);
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (receiptTime > fiveMinutesFromNow) {
        result.checks.timestamp.passed = false;
        result.checks.timestamp.message = 'Timestamp is in the future';
        result.errors.push(result.checks.timestamp.message);
      } else if (receiptTime < oneYearAgo) {
        result.checks.timestamp.passed = false;
        result.checks.timestamp.message = 'Timestamp is older than 1 year';
        result.errors.push(result.checks.timestamp.message);
      } else {
        result.checks.timestamp.passed = true;
        result.checks.timestamp.message = `Issued ${receiptTime.toISOString()}`;
      }
    } else {
      result.checks.timestamp.passed = false;
      result.checks.timestamp.message = 'No timestamp present';
      result.errors.push(result.checks.timestamp.message);
    }

    // Calculate trust score from telemetry
    if (receipt.telemetry?.ciq_metrics) {
      const { clarity = 0, integrity = 0, quality = 0 } = receipt.telemetry.ciq_metrics;
      result.trustScore = Math.round(((clarity + integrity + quality) / 3) * 100);
    } else if (receipt.telemetry?.resonance_score !== undefined) {
      result.trustScore = Math.round(receipt.telemetry.resonance_score * 100);
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

