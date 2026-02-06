/**
 * Trust Receipt Model - MongoDB Schema
 * Stores cryptographic trust receipts for AI interactions
 */

import mongoose, { Schema, Document } from 'mongoose';

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
  tenant_id: string;
  issuer?: string;
  subject?: string;
  agent_id?: string;
  proof?: any;
  // Analysis method transparency (v2.1)
  evaluated_by?: 'llm' | 'heuristic' | 'hybrid';
  analysis_method?: {
    llm_available: boolean;
    resonance_method: 'resonance-engine' | 'llm' | 'heuristic';
    ethics_method: 'llm' | 'heuristic';
    trust_method: 'content-analysis' | 'metadata-only';
    confidence: number;
  };
}

const TrustReceiptSchema = new Schema<ITrustReceipt>(
  {
    self_hash: { type: String, required: true, unique: true, index: true },
    session_id: { type: String, required: true, index: true },
    version: { type: String, required: true, default: '1.0.0' },
    timestamp: { type: Number, required: true, index: true },
    mode: { type: String, required: true, default: 'constitutional' },
    ciq_metrics: {
      clarity: { type: Number, required: true, default: 0 },
      integrity: { type: Number, required: true, default: 0 },
      quality: { type: Number, required: true, default: 0 },
    },
    previous_hash: { type: String },
    signature: { type: String },
    tenant_id: { type: String, required: true, index: true },
    issuer: { type: String },
    subject: { type: String },
    agent_id: { type: String, index: true },
    proof: { type: Schema.Types.Mixed },
    // Analysis method transparency (v2.1)
    evaluated_by: { 
      type: String, 
      enum: ['llm', 'heuristic', 'hybrid'],
      index: true 
    },
    analysis_method: {
      llm_available: { type: Boolean },
      resonance_method: { 
        type: String, 
        enum: ['resonance-engine', 'llm', 'heuristic'] 
      },
      ethics_method: { 
        type: String, 
        enum: ['llm', 'heuristic'] 
      },
      trust_method: { 
        type: String, 
        enum: ['content-analysis', 'metadata-only'] 
      },
      confidence: { type: Number, min: 0, max: 1 },
    },
  },
  {
    timestamps: true,
    collection: 'trust_receipts',
  }
);

// Compound indexes for efficient queries
TrustReceiptSchema.index({ tenant_id: 1, timestamp: -1 });
TrustReceiptSchema.index({ session_id: 1, timestamp: 1 });
TrustReceiptSchema.index({ tenant_id: 1, evaluated_by: 1 });

export const TrustReceiptModel = mongoose.model<ITrustReceipt>('TrustReceipt', TrustReceiptSchema);