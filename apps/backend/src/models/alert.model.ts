// apps/backend/src/models/alert.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  tenant_id: string;
  type: 'trust_violation' | 'policy_breach' | 'emergence_detected' | 'consent_withdrawal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  receipt_id?: string;
  session_id?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved_at?: Date;
  created_at: Date;
}

const AlertSchema = new Schema<IAlert>({
  tenant_id: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['trust_violation', 'policy_breach', 'emergence_detected', 'consent_withdrawal'] },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  title: { type: String, required: true },
  description: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  receipt_id: { type: String, index: true },
  session_id: { type: String, index: true },
  status: { type: String, default: 'active', enum: ['active', 'acknowledged', 'resolved'], index: true },
  acknowledged_by: { type: String },
  acknowledged_at: { type: Date },
  resolved_at: { type: Date },
  created_at: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
AlertSchema.index({ tenant_id: 1, status: 1, created_at: -1 });
AlertSchema.index({ tenant_id: 1, severity: 1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
