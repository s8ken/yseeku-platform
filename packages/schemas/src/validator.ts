/**
 * @sonate/schemas - Schema Validator
 * Runtime validation using AJV (JSON Schema) and Zod
 */

import Ajv, { JSONSchemaType } from 'ajv';
import { z } from 'zod';
import receiptSchema from './receipt.schema.json';
import type { TrustReceipt, VerificationResult } from './receipt.types';

/**
 * Initialize AJV for JSON Schema validation
 */
const ajv = new Ajv({
  strict: false,
});

/**
 * Compile receipt schema for validation
 */
const validateReceiptSchema = ajv.compile(receiptSchema);

/**
 * Zod schema for runtime validation with better errors
 */
const ReceiptZodSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid receipt ID format'),
  version: z.literal('2.0.0'),
  timestamp: z.string().datetime('Invalid ISO 8601 timestamp'),
  session_id: z.string().min(1),
  agent_did: z.string().regex(/^did:sonate:[a-zA-Z0-9]{40}$/, 'Invalid agent DID'),
  human_did: z.string().regex(/^did:sonate:[a-zA-Z0-9]{40}$/, 'Invalid human DID'),
  policy_version: z.string(),
  mode: z.enum(['constitutional', 'directive']),
  interaction: z.object({
    prompt: z.string(),
    response: z.string(),
    model: z.string(),
    provider: z.enum(['openai', 'anthropic', 'aws-bedrock', 'local']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional(),
    reasoning: z.object({
      thought_process: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      retrieved_context: z.array(z.string()).optional(),
    }).optional(),
  }),
  telemetry: z.object({
    resonance_score: z.number().min(0).max(1).optional(),
    resonance_quality: z.enum(['STRONG', 'ADVANCED', 'BREAKTHROUGH']).optional(),
    bedau_index: z.number().min(0).max(1).optional(),
    coherence_score: z.number().min(0).max(1).optional(),
    truth_debt: z.number().min(0).max(1).optional(),
    volatility: z.number().min(0).max(1).optional(),
    ciq_metrics: z.object({
      clarity: z.number().min(0).max(1).optional(),
      integrity: z.number().min(0).max(1).optional(),
      quality: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
  policy_state: z.object({
    constraints_applied: z.array(z.string()).optional(),
    violations: z.array(z.object({
      rule: z.string(),
      severity: z.enum(['warning', 'violation', 'critical']),
      action: z.enum(['warn', 'slow', 'halt', 'escalate']),
    })).optional(),
    consent_verified: z.boolean().optional(),
    override_available: z.boolean().optional(),
  }).optional(),
  chain: z.object({
    previous_hash: z.string().regex(/^[a-f0-9]{64}$|^GENESIS$/),
    chain_hash: z.string().regex(/^[a-f0-9]{64}$/),
    chain_length: z.number().int().positive().optional(),
  }),
  signature: z.object({
    algorithm: z.literal('Ed25519'),
    value: z.string(),
    key_version: z.string(),
    timestamp_signed: z.string().datetime().optional(),
  }),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    context: z.record(z.any()).optional(),
    user_agent: z.string().optional(),
  }).optional(),
});

/**
 * Validate receipt against JSON Schema
 */
export function validateReceiptJSON(receipt: unknown): VerificationResult {
  const checks = {
    schema_valid: false,
    signature_valid: false,
    chain_valid: false,
    chain_hash_valid: false,
  };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Validate schema
    const valid = validateReceiptSchema(receipt);
    
    if (!valid) {
      checks.schema_valid = false;
      errors.push('Schema validation failed');
      if (validateReceiptSchema.errors) {
        validateReceiptSchema.errors.forEach(err => {
          errors.push(`${err.instancePath || 'root'}: ${err.message}`);
        });
      }
      return { valid: false, checks, errors, warnings };
    }
    checks.schema_valid = true;

    const typedReceipt = receipt as unknown as TrustReceipt;

    // Step 2: Validate chain structure
    if (!typedReceipt.chain || !typedReceipt.chain.previous_hash || !typedReceipt.chain.chain_hash) {
      errors.push('Invalid chain structure');
      return { valid: false, checks, errors, warnings };
    }
    checks.chain_valid = true;

    // Step 3: Verify signature structure (not crypto verification - that's separate)
    if (!typedReceipt.signature || !typedReceipt.signature.value) {
      errors.push('Invalid signature structure');
      return { valid: false, checks, errors, warnings };
    }
    checks.signature_valid = true; // Crypto verification happens separately

    // Step 4: Validate chain hash format
    const chainHashValid = /^[a-f0-9]{64}$/.test(typedReceipt.chain.chain_hash);
    if (!chainHashValid) {
      errors.push('Invalid chain hash format');
      return { valid: false, checks, errors, warnings };
    }
    checks.chain_hash_valid = true;

    return {
      valid: errors.length === 0,
      checks,
      errors,
      warnings,
    };
  } catch (err) {
    errors.push(`Validation error: ${err instanceof Error ? err.message : String(err)}`);
    return { valid: false, checks, errors, warnings };
  }
}

/**
 * Validate receipt using Zod (with better error messages)
 */
export function validateReceiptZod(receipt: unknown) {
  return ReceiptZodSchema.safeParse(receipt);
}

/**
 * Check if receipt has required fields for processing
 */
export function isReceiptProcessable(receipt: unknown): receipt is TrustReceipt {
  if (typeof receipt !== 'object' || receipt === null) {
    return false;
  }
  const result = validateReceiptJSON(receipt);
  return result.valid && Object.values(result.checks).every(check => check);
}

/**
 * Export receipt validator
 */
export const receiptValidator = {
  validateJSON: validateReceiptJSON,
  validateZod: validateReceiptZod,
  isProcessable: isReceiptProcessable,
};
