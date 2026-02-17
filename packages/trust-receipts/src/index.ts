/**
 * @sonate/trust-receipts
 *
 * SSL/TLS for AI — cryptographically sign and verify every interaction.
 *
 * Trust Receipts create verifiable audit trails for AI interactions:
 * - Hash prompt and response content (RFC 8785 canonicalization)
 * - Chain receipts with cryptographic links
 * - Sign with Ed25519 for non-repudiation
 * - Track attestation scores
 *
 * @example
 * ```typescript
 * import { TrustReceipts } from '@sonate/trust-receipts';
 * import OpenAI from 'openai';
 *
 * const receipts = new TrustReceipts({
 *   privateKey: process.env.SONATE_PRIVATE_KEY,
 * });
 *
 * const openai = new OpenAI();
 * const messages = [{ role: 'user', content: 'Hello!' }];
 *
 * const { response, receipt } = await receipts.wrap(
 *   () => openai.chat.completions.create({ model: 'gpt-4', messages }),
 *   { sessionId: 'user-123', input: messages }
 * );
 *
 * // receipt.promptHash = SHA-256 of canonicalized input
 * // receipt.responseHash = SHA-256 of AI response
 * // receipt.signature = Ed25519 signature
 * ```
 *
 * @packageDocumentation
 */

// Main wrapper class
export { TrustReceipts } from './wrapper';
export type {
  TrustReceiptsConfig,
  WrapOptions,
  CreateReceiptOptions,
  WrappedResponse,
} from './wrapper';

// Trust Receipt class and types
export { TrustReceipt } from './trust-receipt';
export type {
  TrustReceiptData,
  SignedReceipt,
  Scores,
  // Backwards compatibility
  QualityMetrics,
} from './trust-receipt';

// Cryptographic utilities
export {
  generateKeyPair,
  sign,
  verify,
  getPublicKey,
  sha256,
  bytesToHex,
  hexToBytes,
} from './crypto';
