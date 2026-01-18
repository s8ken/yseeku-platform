import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrainAction extends Document {
  cycleId: Types.ObjectId;
  tenantId: string;
  type: string;
  target: string;
  reason?: string;
  status: 'planned' | 'approved' | 'executed' | 'failed' | 'skipped' | 'overridden';
  result?: Record<string, any>;
  approvedBy?: string;
  executedAt?: Date;
  createdAt: Date;
}

const BrainActionSchema = new Schema<IBrainAction>({
  cycleId: { type: Schema.Types.ObjectId, ref: 'BrainCycle', required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  target: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['planned', 'approved', 'executed', 'failed', 'skipped', 'overridden'], default: 'planned', index: true },
  result: { type: Schema.Types.Mixed },
  approvedBy: { type: String },
  executedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, collection: 'brain_actions' });

BrainActionSchema.index({ tenantId: 1, createdAt: -1 });

export const BrainAction = mongoose.model<IBrainAction>('BrainAction', BrainActionSchema);

