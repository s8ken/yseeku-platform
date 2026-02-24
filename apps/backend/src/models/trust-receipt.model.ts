import mongoose, { Schema, Document } from 'mongoose';

/**
 * Trust Receipt Model with W3C DID Support
 *
 * Trust receipts are now signed by the platform DID and can reference
 * agent DIDs as subjects, making them verifiable credentials.
 */
export interface ITrustReceipt extends Document {
  self_hash: string;
  session_id: string;
  version: string;
  timestamp: number;
  mode: string;
  ciq_metrics: {
    clarity: number;
    integrity: number;
    quality: number;
  };
  previous_hash?: string;
  chain_hash?: string;
  chain_length?: number;
  signature?: string;
  session_nonce?: string;
  tenant_id?: string;

  // DID-related fields for W3C Verifiable Credentials
  issuer?: string;        // Platform DID (did:web:yseeku.com)
  subject?: string;       // Agent DID (did:web:yseeku.com:agents:{id})
  agent_id?: string;      // Reference to the agent
  proof?: {
    type: string;         // 'Ed25519Signature2020'
    created: string;      // ISO timestamp
    verificationMethod: string;  // did:web:yseeku.com#key-1
    proofPurpose: string; // 'assertionMethod'
    proofValue: string;   // Base64 encoded signature
  };

  // v2.2: SYMBI principle scores and weight metadata (NEW)
  sonate_principles?: {
    CONSENT_ARCHITECTURE?: number;
    INSPECTION_MANDATE?: number;
    CONTINUOUS_VALIDATION?: number;
    ETHICAL_OVERRIDE?: number;
    RIGHT_TO_DISCONNECT?: number;
    MORAL_RECOGNITION?: number;
  };
  overall_trust_score?: number;  // 0-100
  trust_status?: 'PASS' | 'PARTIAL' | 'FAIL';
  principle_weights?: {
    CONSENT_ARCHITECTURE?: number;
    INSPECTION_MANDATE?: number;
    CONTINUOUS_VALIDATION?: number;
    ETHICAL_OVERRIDE?: number;
    RIGHT_TO_DISCONNECT?: number;
    MORAL_RECOGNITION?: number;
  };
  weight_source?: string;  // 'standard'|'healthcare'|'finance'|etc
  weight_policy_id?: string;  // Policy reference

  // v2.1: Analysis method transparency (LLM vs Heuristic detection)
  evaluated_by?: 'llm' | 'heuristic' | 'hybrid';
  analysis_method?: {
    llmAvailable: boolean;
    resonanceMethod: 'resonance-engine' | 'llm' | 'heuristic';
    ethicsMethod: 'llm' | 'heuristic';
    trustMethod: 'content-analysis' | 'metadata-only';
    confidence: number;
  };

  createdAt: Date;
}

const TrustReceiptSchema = new Schema<ITrustReceipt>({
  self_hash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  timestamp: {
    type: Number,
    required: true,
  },
  mode: {
    type: String,
    default: 'constitutional',
  },
  ciq_metrics: {
    clarity: Number,
    integrity: Number,
    quality: Number,
  },
  previous_hash: String,
  chain_hash: {
    type: String,
    index: true,
  },
  chain_length: Number,
  signature: String,
  session_nonce: String,
  tenant_id: {
    type: String,
    index: true,
  },

  // DID-related fields
  issuer: {
    type: String,
    index: true,
  },
  subject: {
    type: String,
    index: true,
  },
  agent_id: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
    index: true,
  },
  proof: {
    type: {
      type: String,
    },
    created: String,
    verificationMethod: String,
    proofPurpose: String,
    proofValue: String,
  },

  // v2.2: SYMBI principle scores and weight metadata (NEW)
  sonate_principles: {
    CONSENT_ARCHITECTURE: Number,
    INSPECTION_MANDATE: Number,
    CONTINUOUS_VALIDATION: Number,
    ETHICAL_OVERRIDE: Number,
    RIGHT_TO_DISCONNECT: Number,
    MORAL_RECOGNITION: Number,
  },
  overall_trust_score: Number,
  trust_status: {
    type: String,
    enum: ['PASS', 'PARTIAL', 'FAIL'],
  },
  principle_weights: {
    CONSENT_ARCHITECTURE: Number,
    INSPECTION_MANDATE: Number,
    CONTINUOUS_VALIDATION: Number,
    ETHICAL_OVERRIDE: Number,
    RIGHT_TO_DISCONNECT: Number,
    MORAL_RECOGNITION: Number,
  },
  weight_source: {
    type: String,
    index: true,
  },
  weight_policy_id: {
    type: String,
    index: true,
  },

  // v2.1: Analysis method transparency
  evaluated_by: {
    type: String,
    enum: ['llm', 'heuristic', 'hybrid'],
    index: true,
  },
  analysis_method: {
    llmAvailable: Boolean,
    resonanceMethod: {
      type: String,
      enum: ['resonance-engine', 'llm', 'heuristic'],
    },
    ethicsMethod: {
      type: String,
      enum: ['llm', 'heuristic'],
    },
    trustMethod: {
      type: String,
      enum: ['content-analysis', 'metadata-only'],
    },
    confidence: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for DID-based queries
TrustReceiptSchema.index({ issuer: 1, subject: 1 });

export const TrustReceiptModel = mongoose.model<ITrustReceipt>('TrustReceipt', TrustReceiptSchema);
