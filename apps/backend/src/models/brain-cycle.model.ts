import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrainActionRef {
  type: string;
  target: string;
  reason?: string;
  status: 'planned' | 'approved' | 'executed' | 'failed' | 'skipped';
}

export interface IBrainCycle extends Document {
  tenantId: string;
  status: 'started' | 'completed' | 'failed';
  observations: string[];
  actions: IBrainActionRef[];
  inputContext: Record<string, any>;
  llmOutput?: string;
  metrics: { durationMs?: number; error?: string };
  startedAt: Date;
  completedAt?: Date;
}

const BrainCycleSchema = new Schema<IBrainCycle>({
  tenantId: { type: String, required: true, index: true },
  status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started', index: true },
  observations: { type: [String], default: [] },
  actions: [{
    type: { type: String },
    target: { type: String },
    reason: { type: String },
    status: { type: String, enum: ['planned', 'approved', 'executed', 'failed', 'skipped'], default: 'planned' }
  }],
  inputContext: { type: Schema.Types.Mixed, default: {} },
  llmOutput: { type: String },
  metrics: { type: Schema.Types.Mixed, default: {} },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: false, collection: 'brain_cycles' });

BrainCycleSchema.index({ tenantId: 1, startedAt: -1 });

export const BrainCycle = mongoose.model<IBrainCycle>('BrainCycle', BrainCycleSchema);

