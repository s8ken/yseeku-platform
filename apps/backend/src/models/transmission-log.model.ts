/**
 * Transmission Log Model
 *
 * Persists data-transmission events between AI agents, the platform, and
 * external systems. Supports GDPR Article 30 (Records of Processing Activities)
 * and SOC2 audit trail requirements.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITransmissionLog extends Document {
  source: string;        // e.g. 'user', 'ai-agent', 'overseer', 'webhook'
  destination: string;   // e.g. 'llm-provider', 'trust-kernel', 'external-webhook'
  dataType: string;      // e.g. 'chat-message', 'trust-receipt', 'alert'
  tenantId: string;
  sessionId?: string;
  agentId?: string;
  userId?: string;
  payloadHash?: string;  // SHA-256 of payload — content is NOT stored for privacy
  sizeBytes?: number;
  direction: 'inbound' | 'outbound' | 'internal';
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  metadata?: Record<string, any>;
  recordedAt: Date;
}

const TransmissionLogSchema = new Schema<ITransmissionLog>(
  {
    source: { type: String, required: true, index: true },
    destination: { type: String, required: true, index: true },
    dataType: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    sessionId: { type: String, index: true },
    agentId: { type: String, index: true },
    userId: { type: String, index: true },
    payloadHash: { type: String },
    sizeBytes: { type: Number },
    direction: {
      type: String,
      enum: ['inbound', 'outbound', 'internal'],
      default: 'internal',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'partial'],
      default: 'success',
      index: true,
    },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false, // We manage recordedAt manually for GDPR timestamp accuracy
    collection: 'transmission_logs',
  }
);

// Compound indexes for common audit queries
TransmissionLogSchema.index({ tenantId: 1, recordedAt: -1 });
TransmissionLogSchema.index({ tenantId: 1, dataType: 1, recordedAt: -1 });
TransmissionLogSchema.index({ tenantId: 1, source: 1, destination: 1, recordedAt: -1 });

// TTL index — auto-purge logs after 2 years for GDPR data minimisation
TransmissionLogSchema.index(
  { recordedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 730 } // 730 days
);

export const TransmissionLog = mongoose.model<ITransmissionLog>(
  'TransmissionLog',
  TransmissionLogSchema
);
