/**
 * @sonate/trust-receipts
 *
 * Trust Receipts SDK - Cryptographically signed audit trails for AI interactions.
 *
 * Like SSL certificates for web connections, Trust Receipts provide verifiable
 * proof that AI interactions occurred as claimed, enabling:
 *
 * - Audit trails for compliance
 * - Tamper-evident logs
 * - Chain-of-custody for AI outputs
 * - Quality metrics tracking
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
 *
 * const { response, receipt } = await receipts.wrap(
 *   () => openai.chat.completions.create({
 *     model: 'gpt-4',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   }),
 *   { sessionId: 'user-123' }
 * );
 *
 * // response is the OpenAI response
 * // receipt is a signed, hash-chained audit record
 * ```
 *
 * @packageDocumentation
 */

// Main wrapper class
export { TrustReceipts } from './wrapper';
export type {
  TrustReceiptsConfig,
  WrapOptions,
  WrappedResponse,
} from './wrapper';

// Trust Receipt class and types
export { TrustReceipt } from './trust-receipt';
export type {
  TrustReceiptData,
  SignedReceipt,
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
