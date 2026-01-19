import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Webhook Configuration Model
 * Stores webhook endpoints and alert routing rules
 */

export type WebhookChannelType = 'slack' | 'discord' | 'teams' | 'email' | 'custom' | 'pagerduty' | 'webhook';

export interface WebhookChannelConfig {
  type: WebhookChannelType;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  email?: string;
}

export type WebhookChannel = WebhookChannelType | WebhookChannelConfig;

export type WebhookStatus = 'active' | 'paused' | 'failed';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs?: number;
  timeoutMs?: number;
}

export interface RateLimiting {
  enabled?: boolean;
  maxPerMinute?: number;
  maxPerHour?: number;
  windowMs?: number;
  maxRequests?: number;
}

export interface IWebhookConfig extends Document {
  tenantId: string;
  name: string;
  description?: string;
  channel: WebhookChannel;
  channels?: WebhookChannel[]; // Multiple channels support
  
  // Enabled flag
  enabled: boolean;
  
  // Endpoint configuration
  url: string;
  secret?: string; // For HMAC signing
  headers?: Record<string, string>;
  
  // Alert filtering
  alertTypes: string[]; // Which alert types to send (empty = all)
  eventTypes?: string[]; // Alternative name for alert types
  severities: string[]; // Which severities to send (empty = all)
  severityFilter?: AlertSeverity[]; // Alternative severity filter
  
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
  rateLimiting?: RateLimiting;
  
  // Retry configuration
  retryConfig?: RetryConfig;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  severity?: AlertSeverity;
  
  // Trigger conditions
  condition: AlertCondition;
  conditions?: AlertCondition[]; // Multiple conditions support
  
  // Throttling
  cooldownMinutes: number;
  lastTriggeredAt?: Date;
}

// Alias for backwards compatibility
export type AlertRuleCondition = AlertCondition;

export interface AlertCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string | number | boolean | string[];
  threshold?: number;
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
  
  // Enabled flag
  enabled: {
    type: Boolean,
    default: true,
  },
  
  // Filtering
  alertTypes: {
    type: [String],
    default: [],
  },
  eventTypes: {
    type: [String],
    default: [],
  },
  severities: {
    type: [String],
    default: [],
  },
  severityFilter: {
    type: [String],
    enum: ['info', 'warning', 'error', 'critical'],
    default: [],
  },
  
  // Multiple channels
  channels: {
    type: [String],
    enum: ['webhook', 'slack', 'discord', 'pagerduty', 'email'],
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
  rateLimiting: {
    windowMs: { type: Number, default: 60000 },
    maxRequests: { type: Number, default: 100 },
  },
  
  // Retry configuration
  retryConfig: {
    maxRetries: { type: Number, default: 3 },
    initialDelayMs: { type: Number, default: 1000 },
    maxDelayMs: { type: Number, default: 30000 },
    backoffMultiplier: { type: Number, default: 2 },
  },
  
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
