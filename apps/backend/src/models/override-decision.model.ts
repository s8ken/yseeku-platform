import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOverrideDecision extends Document {
  actionId: Types.ObjectId;
  userId: string;
  decision: 'approve' | 'reject';
  reason: string;
  emergency: boolean;
  impact?: Record<string, any>;
  tenantId: string;
  createdAt: Date;
}

const OverrideDecisionSchema = new Schema<IOverrideDecision>({
  actionId: { type: Schema.Types.ObjectId, ref: 'BrainAction', required: true, index: true },
  userId: { type: String, required: true, index: true },
  decision: { type: String, enum: ['approve', 'reject'], required: true },
  reason: { type: String, required: true },
  emergency: { type: Boolean, default: false, index: true },
  impact: { type: Schema.Types.Mixed },
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'override_decisions' });

OverrideDecisionSchema.index({ tenantId: 1, createdAt: -1 });
OverrideDecisionSchema.index({ actionId: 1 });

export const OverrideDecision = mongoose.model<IOverrideDecision>('OverrideDecision', OverrideDecisionSchema);