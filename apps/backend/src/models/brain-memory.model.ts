import mongoose, { Schema, Document } from 'mongoose';

export interface IBrainMemory extends Document {
  tenantId: string;
  kind: string;
  payload: Record<string, any>;
  tags: string[];
  acl?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

const BrainMemorySchema = new Schema<IBrainMemory>(
  {
    tenantId: { type: String, required: true, index: true },
    kind: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    acl: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: false, collection: 'brain_memory' }
);

BrainMemorySchema.index({ tenantId: 1, kind: 1, createdAt: -1 });
// TTL: expire documents when expiresAt is reached (value set by caller; null = never expires)
BrainMemorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const BrainMemory = mongoose.model<IBrainMemory>('BrainMemory', BrainMemorySchema);
