/**
 * @sonate/schemas
 * 
 * Shared schema definitions for SONATE platform
 * - Receipt schema (JSON Schema + TypeScript)
 * - DID schema
 * - Runtime validators
 * 
 * @example
 * ```typescript
 * import { TrustReceipt, receiptValidator } from '@sonate/schemas';
 * 
 * const receipt: TrustReceipt = { ... };
 * const result = receiptValidator.validateJSON(receipt);
 * 
 * if (result.valid) {
 *   console.log('Receipt is valid');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */

// Export types
export type {
  TrustReceipt,
  CreateReceiptInput,
  VerificationResult,
  AIInteraction,
  Telemetry,
  PolicyState,
  PolicyViolation,
  HashChain,
  DigitalSignature,
  DID,
} from './receipt.types';

export type {
  InteractionMode,
  AIProvider,
  ViolationSeverity,
  PolicyAction,
  ResonanceQuality,
  SignatureAlgorithm,
} from './receipt.types';

// Export validators
export { receiptValidator, validateReceiptJSON, validateReceiptZod, isReceiptProcessable } from './validator';

// Export schema
import receiptSchemaJSON from './receipt.schema.json';
export const RECEIPT_SCHEMA = receiptSchemaJSON;

// Version
export const SCHEMA_VERSION = '2.0.0';
