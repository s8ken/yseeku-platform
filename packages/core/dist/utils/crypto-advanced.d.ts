/**
 * Cryptographic Verification Module
 * Ed25519 and secp256k1 signature verification with canonicalization
 *
 * P0 CRITICAL: Required for pilot
 */
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
/**
 * Canonicalize JSON for deterministic signing
 * Uses JSON Canonicalization Scheme (JCS) RFC 8785
 */
export declare function canonicalizeJSON(data: any, options?: CanonicalizeOptions): string;
/**
 * Verify Ed25519 signature
 * Used for DID documents and verifiable credentials
 */
export declare function verifyEd25519Signature(data: any, signatureMultibase: string, publicKeyMultibase: string, options?: CanonicalizeOptions): Promise<SignatureVerificationResult>;
/**
 * Verify secp256k1 signature (for Ethereum DIDs)
 * ES256K algorithm
 */
export declare function verifySecp256k1Signature(data: any, signatureHex: string, publicKeyHex: string, options?: CanonicalizeOptions): Promise<SignatureVerificationResult>;
/**
 * Verify RSA signature (RS256)
 * For backward compatibility with JWT systems
 */
export declare function verifyRSASignature(data: any, signature: string, publicKey: string, options?: CanonicalizeOptions): Promise<SignatureVerificationResult>;
/**
 * Verify a verifiable credential proof
 */
export declare function verifyCredentialProof(credential: any, options?: CanonicalizeOptions): Promise<SignatureVerificationResult>;
/**
 * Generate crypto-secure random bytes
 * Use this instead of Math.random() for keys/nonces
 */
export declare function generateSecureRandom(length: number): Uint8Array;
/**
 * Generate Ed25519 key pair
 */
export declare function generateEd25519KeyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}>;
/**
 * Sign data with Ed25519
 */
export declare function signEd25519(data: any, privateKey: Uint8Array): Promise<Uint8Array>;
/**
 * Generate crypto-secure API key
 * Replacement for Math.random() based generation
 */
export declare function generateSecureApiKey(length?: number): string;
/**
 * Generate nonce for replay protection
 */
export declare function generateNonce(): string;
/**
 * Timing-safe string comparison
 * Prevents timing attacks on tokens/secrets
 */
export declare function timingSafeEqual(a: string, b: string): boolean;
