import mongoose, { Schema, Document, Model } from 'mongoose';

export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

export interface IAlert extends Document {
  timestamp: Date;
  type: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  details?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  tenantId: string;
}

const AlertSchema = new Schema<IAlert>({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  type: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['critical', 'error', 'warning', 'info'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'suppressed'],
    default: 'active',
    index: true,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedBy: String,
  resolvedAt: Date,
  userId: {
    type: String,
    index: true,
  },
  agentId: {
    type: String,
    index: true,
  },
  conversationId: {
    type: String,
    index: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
    default: 'default',
  },
});

// Compound indexes for common queries
AlertSchema.index({ tenantId: 1, status: 1, timestamp: -1 });
AlertSchema.index({ tenantId: 1, severity: 1, status: 1 });
AlertSchema.index({ tenantId: 1, type: 1, timestamp: -1 });

export const AlertModel: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
