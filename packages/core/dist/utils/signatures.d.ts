/**
 * Cryptographic Signature Utilities
 *
 * Implements: https://gammatria.com/schemas/trust-receipt#signatures
 *
 * Uses Ed25519 for high-performance digital signatures
 */
/**
 * Sign a payload with Ed25519 private key
 *
 * @param payload - Data to sign (usually a hash)
 * @param privateKey - Ed25519 private key (32 bytes)
 * @returns Signature as hex string
 */
export declare function signPayload(payload: string, privateKey: Uint8Array): Promise<string>;
/**
 * Verify signature with Ed25519 public key
 *
 * @param signature - Signature as hex string
 * @param payload - Original payload
 * @param publicKey - Ed25519 public key (32 bytes)
 * @returns true if signature is valid
 */
export declare function verifySignature(signature: string, payload: string, publicKey: Uint8Array): Promise<boolean>;
/**
 * Generate Ed25519 key pair
 *
 * @returns Object with privateKey and publicKey as Uint8Array
 */
export declare function generateKeyPair(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
}>;
