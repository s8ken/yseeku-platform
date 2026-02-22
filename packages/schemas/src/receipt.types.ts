/**
 * @sonate/schemas - Receipt Types
 * Generated from receipt.schema.json
 * 
 * Defines the formal structure of SONATE Trust Receipts
 */

/**
 * Constraint violation from policy enforcement
 */
export interface ConstraintViolation {
  /** Violation ID */
  id: string;
  
  /** ID of constraint that triggered this violation */
  constraint_id: string;
  
  /** Name of constraint */
  constraint_name: string;
  
  /** Type of violation */
  violation_type: 'PII_DETECTED' | 'TRUTH_DEBT_EXCEEDED' | 'COMPLIANCE_BOUNDARY_VIOLATED' | 'POLICY_CONSTRAINT_FAILED' | 'CUSTOM_VIOLATION';
  
  /** Severity level */
  severity: 'warn' | 'block' | 'escalate';
  
  /** Human-readable violation message */
  message: string;
  
  /** Supporting evidence for violation */
  evidence: Record<string, any>;
  
  /** Annotation to add to receipt */
  receipt_annotation: string;
  
  /** When violation was detected */
  detected_at: string;
  
  /** Suggested remediation action */
  remediation_suggested?: string;
}

/**
 * Policy enforcement action
 */
export type PolicyEnforcementAction = 'ALERT' | 'ANNOTATE' | 'BLOCK' | 'ESCALATE' | 'REQUIRE_HUMAN_REVIEW';

/**
 * Interaction mode: constitutional (principle-based) or directive (instruction-based)
 */
export type InteractionMode = 'constitutional' | 'directive';

/**
 * AI provider identifier
 */
export type AIProvider = 'openai' | 'anthropic' | 'aws-bedrock' | 'local';

/**
 * Violation severity level
 */
export type ViolationSeverity = 'warning' | 'violation' | 'critical';

/**
 * Action taken in response to policy violation
 */
export type PolicyAction = 'warn' | 'slow' | 'halt' | 'escalate';

/**
 * Resonance quality rating
 */
export type ResonanceQuality = 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';

/**
 * Signature algorithm
 */
export type SignatureAlgorithm = 'Ed25519';

/**
 * AI Interaction data
 */
export interface AIInteraction {
  /** User's input/question to the AI (omitted when content hashing is enabled) */
  prompt?: string;

  /** AI's response (omitted when content hashing is enabled) */
  response?: string;

  /** SHA-256 hash of the prompt (privacy-preserving alternative to raw content) */
  prompt_hash?: string;

  /** SHA-256 hash of the response (privacy-preserving alternative to raw content) */
  response_hash?: string;

  /** Model identifier used (e.g., 'gpt-4-turbo', 'claude-3-sonnet') */
  model: string;
  
  /** AI provider */
  provider?: AIProvider;
  
  /** Model temperature setting (0-2) */
  temperature?: number;
  
  /** Maximum tokens allowed */
  max_tokens?: number;
  
  /** Optional: Captured reasoning signals from model */
  reasoning?: {
    /** Internal reasoning if exposed by model */
    thought_process?: string;
    
    /** Model's confidence score (0-1) */
    confidence?: number;
    
    /** External context retrieved for this interaction */
    retrieved_context?: string[];
  };
}

/**
 * Trust and coherence metrics
 */
export interface Telemetry {
  /** Overall trust/resonance score (0-1) */
  resonance_score?: number;
  
  /** Qualitative rating of resonance */
  resonance_quality?: ResonanceQuality;
  
  /** Weak emergence detection (0-1) */
  bedau_index?: number;
  
  /** LBC (Longitudinal Behavioral Coherence) score */
  coherence_score?: number;
  
  /** Measure of unverifiable claims (0-1) */
  truth_debt?: number;
  
  /** Behavioral volatility score (0-1) */
  volatility?: number;
  
  /** Clarity, Integrity, Quality scores */
  ciq_metrics?: {
    /** Communication clarity (0-1) */
    clarity?: number;
    /** Reasoning transparency (0-1) */
    integrity?: number;
    /** Overall value (0-1) */
    quality?: number;
  };
  
  // NEW: SYMBI principle scores and metrics (v2.2)
  /** SYMBI constitutional principle scores (0-10 each) */
  sonate_principles?: {
    CONSENT_ARCHITECTURE?: number;
    INSPECTION_MANDATE?: number;
    CONTINUOUS_VALIDATION?: number;
    ETHICAL_OVERRIDE?: number;
    RIGHT_TO_DISCONNECT?: number;
    MORAL_RECOGNITION?: number;
  };
  
  /** Overall trust score derived from weighted principles (0-100) */
  overall_trust_score?: number;
  
  /** Trust status from principle evaluation */
  trust_status?: 'PASS' | 'PARTIAL' | 'FAIL';
  
  /** Weights applied to principles for calculation */
  principle_weights?: {
    CONSENT_ARCHITECTURE?: number;
    INSPECTION_MANDATE?: number;
    CONTINUOUS_VALIDATION?: number;
    ETHICAL_OVERRIDE?: number;
    RIGHT_TO_DISCONNECT?: number;
    MORAL_RECOGNITION?: number;
  };
  
  /** Which policy's weights were applied (standard|healthcare|finance|government|etc) */
  weight_source?: string;
  
  /** Policy ID reference for the weights used */
  weight_policy_id?: string;
}

/**
 * Policy violation record
 */
export interface PolicyViolation {
  /** Policy rule that was violated */
  rule: string;
  
  /** Severity level */
  severity: ViolationSeverity;
  
  /** Action taken in response */
  action: PolicyAction;
}

/**
 * State of policy constraints at time of interaction
 */
export interface PolicyState {
  /** Which policy constraints were active */
  constraints_applied?: string[];
  
  /** Any policy violations detected */
  violations?: PolicyViolation[];
  
  /** Was explicit user consent verified? */
  consent_verified?: boolean;
  
  /** Did user have option to override? */
  override_available?: boolean;
}

/**
 * Hash chain for immutability
 */
export interface HashChain {
  /** Hash of previous receipt (or 'GENESIS' for first) */
  previous_hash: string;
  
  /** SHA-256(canonical_json + previous_hash) */
  chain_hash: string;
  
  /** Number of receipts in this chain */
  chain_length?: number;
}

/**
 * Cryptographic signature
 */
export interface DigitalSignature {
  /** Signature algorithm used */
  algorithm: SignatureAlgorithm;
  
  /** Base64-encoded signature of canonical receipt */
  value: string;
  
  /** Which version of agent's key was used */
  key_version: string;
  
  /** When receipt was signed */
  timestamp_signed?: string;
}

/**
 * SONATE Trust Receipt - Core Structure
 * 
 * Represents a cryptographically signed, immutable record of an AI interaction
 * with full audit trail, policy state, and trust metrics.
 * 
 * @example
 * ```typescript
 * const receipt: TrustReceipt = {
 *   id: "abcd1234...ef5678",
 *   version: "2.0.0",
 *   timestamp: "2026-02-09T18:30:45.123Z",
 *   session_id: "session_abc123",
 *   agent_did: "did:sonate:a1b2c3d4e5f6...",
 *   human_did: "did:sonate:x9y8z7w6v5u4...",
 *   policy_version: "policy_v1.2.0",
 *   mode: "constitutional",
 *   interaction: {
 *     prompt: "What is the capital of France?",
 *     response: "Paris is the capital of France.",
 *     model: "gpt-4-turbo",
 *     provider: "openai"
 *   },
 *   signature: {
 *     algorithm: "Ed25519",
 *     value: "MEQCIDGrvmTEr7c00rpf5Z+O50Ad5Z8Xxfqfjf9Z8O50Ad5==",
 *     key_version: "key_v1"
 *   },
 *   chain_hash: "abcd1234...ef5678"
 * };
 * ```
 */
export interface TrustReceipt {
  /** Unique receipt identifier (SHA-256 hash) */
  id: string;
  
  /** Receipt schema version */
  version: "2.0.0";
  
  /** ISO 8601 timestamp of interaction */
  timestamp: string;
  
  /** Conversation/session identifier */
  session_id: string;
  
  /** DID of the AI agent */
  agent_did: string;
  
  /** DID of the human user */
  human_did: string;
  
  /** Version of policy that governed this interaction */
  policy_version: string;
  
  /** Governance mode */
  mode: InteractionMode;
  
  /** The actual AI interaction data */
  interaction: AIInteraction;
  
  /** Trust and coherence metrics */
  telemetry?: Telemetry;
  
  /** State of policy constraints */
  policy_state?: PolicyState;
  
  /** Hash chain for immutability */
  chain: HashChain;
  
  /** Cryptographic signature */
  signature: DigitalSignature;
  
  /** Optional metadata */
  metadata?: {
    /** Custom tags for categorization */
    tags?: string[];
    /** Application-specific context */
    context?: Record<string, any>;
    /** Client that generated this receipt */
    user_agent?: string;
  };
  
  /** Policy enforcement results (Phase 2) */
  policy_enforcement?: {
    /** List of policy IDs evaluated */
    policies_evaluated: string[];
    /** Constraint violations detected */
    violations: ConstraintViolation[];
    /** Overall policy compliance status */
    status: 'CLEAR' | 'FLAGGED' | 'BLOCKED';
    /** Whether human review is required */
    human_review_required: boolean;
    /** When policy enforcement was performed */
    enforcement_timestamp: string;
    /** Actions taken as result of policy enforcement */
    actions_taken?: PolicyEnforcementAction[];
  };
}

/**
 * Receipt creation input (without computed fields)
 */
export interface CreateReceiptInput {
  session_id: string;
  agent_did: string;
  human_did: string;
  policy_version: string;
  mode: InteractionMode;
  interaction: AIInteraction;
  telemetry?: Telemetry;
  policy_state?: PolicyState;
  previous_hash?: string;
  metadata?: {
    tags?: string[];
    context?: Record<string, any>;
    user_agent?: string;
  };
}

/**
 * Receipt verification result
 */
export interface VerificationResult {
  /** Is the receipt valid? */
  valid: boolean;
  
  /** Specific checks performed */
  checks: {
    /** Schema validation passed */
    schema_valid: boolean;
    /** Signature verification passed */
    signature_valid: boolean;
    /** Chain integrity intact */
    chain_valid: boolean;
    /** Hash chain verified */
    chain_hash_valid: boolean;
  };
  
  /** Any errors encountered */
  errors: string[];
  
  /** Warnings (non-fatal issues) */
  warnings: string[];
}

/**
 * Batch export format for SIEM tools
 */
export interface ReceiptExportBatch {
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    exported_at: string;
    /** Number of receipts in batch */
    count: number;
    /** Time range covered */
    time_range?: {
      start: string;
      end: string;
    };
    /** Format version */
    format_version: "1.0.0";
  };
  
  /** Receipts in batch */
  receipts: TrustReceipt[];
}

/**
 * DID (Decentralized Identifier) Structure
 */
export interface DID {
  /** DID identifier */
  id: string;
  
  /** DID document */
  document: {
    /** Public keys associated with this DID */
    public_keys: Array<{
      /** Key identifier */
      id: string;
      /** Key type (currently Ed25519) */
      type: "Ed25519";
      /** Public key (base64) */
      value: string;
      /** When key was created */
      created_at: string;
      /** When key was rotated (null if current) */
      rotated_at?: string;
    }>;
    
    /** Creation timestamp */
    created_at: string;
    
    /** Last update timestamp */
    updated_at: string;
  };
  
  /** Current key version */
  current_key_version: string;
  
  /** Is DID active? */
  active: boolean;
}
