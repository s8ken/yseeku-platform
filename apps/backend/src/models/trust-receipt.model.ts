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
  session_nonce?: string;
  tenant_id?: string;
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const TrustReceiptModel = mongoose.model<ITrustReceipt>('TrustReceipt', TrustReceiptSchema);
