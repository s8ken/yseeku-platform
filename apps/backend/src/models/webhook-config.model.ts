import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Webhook Configuration Model
 * Stores webhook endpoints and alert routing rules
 */

export type WebhookChannel = 'webhook' | 'slack' | 'discord' | 'pagerduty' | 'email';
export type WebhookStatus = 'active' | 'paused' | 'failed';

export interface IWebhookConfig extends Document {
  tenantId: string;
  name: string;
  description?: string;
  channel: WebhookChannel;
  
  // Endpoint configuration
  url: string;
  secret?: string; // For HMAC signing
  headers?: Record<string, string>;
  
  // Alert filtering
  alertTypes: string[]; // Which alert types to send (empty = all)
  severities: string[]; // Which severities to send (empty = all)
  
  // Advanced rules
  rules: AlertRule[];
  
  // Status & health
  status: WebhookStatus;
  lastSuccess?: Date;
  lastFailure?: Date;
  failureCount: number;
  consecutiveFailures: number;
  
  // Rate limiting
  maxPerMinute: number;
  sentThisMinute: number;
  minuteResetAt: Date;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  
  // Trigger conditions
  condition: AlertCondition;
  
  // Throttling
  cooldownMinutes: number;
  lastTriggeredAt?: Date;
}

export interface AlertCondition {
  type: 'trust_threshold' | 'drift_threshold' | 'emergence_level' | 'agent_action' | 'overseer_action' | 'custom';
  
  // For threshold conditions
  metric?: string;
  operator?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq';
  value?: number | string;
  
  // For pattern matching
  pattern?: string;
  
  // For custom conditions (JavaScript expression)
  expression?: string;
}

const AlertRuleSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  condition: {
    type: { type: String, required: true },
    metric: String,
    operator: String,
    value: Schema.Types.Mixed,
    pattern: String,
    expression: String,
  },
  cooldownMinutes: { type: Number, default: 5 },
  lastTriggeredAt: Date,
}, { _id: false });

const WebhookConfigSchema = new Schema<IWebhookConfig>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  channel: {
    type: String,
    enum: ['webhook', 'slack', 'discord', 'pagerduty', 'email'],
    default: 'webhook',
  },
  
  // Endpoint
  url: {
    type: String,
    required: true,
  },
  secret: String,
  headers: {
    type: Map,
    of: String,
    default: {},
  },
  
  // Filtering
  alertTypes: {
    type: [String],
    default: [],
  },
  severities: {
    type: [String],
    default: [],
  },
  
  // Rules
  rules: {
    type: [AlertRuleSchema],
    default: [],
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'failed'],
    default: 'active',
  },
  lastSuccess: Date,
  lastFailure: Date,
  failureCount: { type: Number, default: 0 },
  consecutiveFailures: { type: Number, default: 0 },
  
  // Rate limiting
  maxPerMinute: { type: Number, default: 60 },
  sentThisMinute: { type: Number, default: 0 },
  minuteResetAt: { type: Date, default: Date.now },
  
  // Metadata
  createdBy: { type: String, required: true },
}, {
  timestamps: true,
  collection: 'webhook_configs',
});

// Indexes
WebhookConfigSchema.index({ tenantId: 1, status: 1 });
WebhookConfigSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const WebhookConfigModel: Model<IWebhookConfig> = 
  mongoose.models.WebhookConfig || mongoose.model<IWebhookConfig>('WebhookConfig', WebhookConfigSchema);
