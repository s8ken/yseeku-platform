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

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for DID-based queries
TrustReceiptSchema.index({ issuer: 1, subject: 1 });

export const TrustReceiptModel = mongoose.model<ITrustReceipt>('TrustReceipt', TrustReceiptSchema);
