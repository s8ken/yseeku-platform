import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Webhook Delivery Log Model
 * Tracks all webhook delivery attempts for debugging and analytics
 */

export type DeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

export interface IWebhookDelivery extends Document {
  tenantId: string;
  webhookConfigId: mongoose.Types.ObjectId;
  
  // Alert that triggered this
  alertId?: mongoose.Types.ObjectId;
  alertType: string;
  alertSeverity: string;
  
  // Rule that matched (if any)
  ruleId?: string;
  ruleName?: string;
  
  // Delivery details
  status: DeliveryStatus;
  url: string;
  method: string;
  
  // Request
  requestBody: string;
  requestHeaders: Record<string, string>;
  
  // Response
  responseStatus?: number;
  responseBody?: string;
  responseTime?: number; // ms
  
  // Retry tracking
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  
  // Error info
  error?: string;
  
  // Timestamps
  createdAt: Date;
  deliveredAt?: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  webhookConfigId: {
    type: Schema.Types.ObjectId,
    ref: 'WebhookConfig',
    required: true,
    index: true,
  },
  
  alertId: {
    type: Schema.Types.ObjectId,
    ref: 'Alert',
    index: true,
  },
  alertType: { type: String, required: true },
  alertSeverity: { type: String, required: true },
  
  ruleId: String,
  ruleName: String,
  
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'retrying'],
    default: 'pending',
    index: true,
  },
  url: { type: String, required: true },
  method: { type: String, default: 'POST' },
  
  requestBody: String,
  requestHeaders: {
    type: Map,
    of: String,
    default: {},
  },
  
  responseStatus: Number,
  responseBody: String,
  responseTime: Number,
  
  attempt: { type: Number, default: 1 },
  maxAttempts: { type: Number, default: 3 },
  nextRetryAt: Date,
  
  error: String,
  
  deliveredAt: Date,
}, {
  timestamps: true,
  collection: 'webhook_deliveries',
});

// Indexes for queries
WebhookDeliverySchema.index({ tenantId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ webhookConfigId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ status: 1, nextRetryAt: 1 }); // For retry queue
WebhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 day TTL

export const WebhookDeliveryModel: Model<IWebhookDelivery> = 
  mongoose.models.WebhookDelivery || mongoose.model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);
