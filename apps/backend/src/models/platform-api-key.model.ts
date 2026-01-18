import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformApiKey extends Document {
  userId: string;
  tenantId: string;
  name: string;
  keyHash: string; // Store hashed key for security
  prefix: string; // Store first few chars for display (e.g. "sk_live_...")
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  lastUsed?: Date;
  expiresAt?: Date;
  requests24h: number; // Simple counter for demo/MVP
  createdAt: Date;
  updatedAt: Date;
}

const PlatformApiKeySchema = new Schema<IPlatformApiKey>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  keyHash: {
    type: String,
    required: true,
    select: false, // Don't return by default
  },
  prefix: {
    type: String,
    required: true,
  },
  scopes: {
    type: [String],
    default: ['read:all'],
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active',
  },
  lastUsed: Date,
  expiresAt: Date,
  requests24h: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps on save
PlatformApiKeySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const PlatformApiKey = mongoose.model<IPlatformApiKey>('PlatformApiKey', PlatformApiKeySchema);
