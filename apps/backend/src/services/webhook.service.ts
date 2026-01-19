import mongoose from 'mongoose';
import {
  IWebhookConfig,
  WebhookConfigModel,
  AlertRule,
  AlertCondition,
  AlertRuleCondition,
  RateLimiting,
  RetryConfig,
  WebhookChannel,
  WebhookChannelConfig,
  WebhookChannelType,
} from '../models/webhook-config.model';
import { WebhookDeliveryModel, IWebhookDelivery, DeliveryStatus } from '../models/webhook-delivery.model';
import { AlertModel, IAlert } from '../models/alert.model';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Webhook Delivery Service
 * Handles alert routing, webhook delivery with retries, and channel-specific formatting
 */

// Metric snapshot for rule evaluation
interface MetricSnapshot {
  trustScore?: number;
  driftScore?: number;
  emergenceLevel?: number;
  bedauIndex?: number;
  principleScore?: number;
  consentRate?: number;
  alertCount?: number;
  errorRate?: number;
  latencyP95?: number;
  [key: string]: number | undefined;
}

// Webhook payload structure
interface WebhookPayload {
  event: string;
  timestamp: string;
  alert: {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    details?: Record<string, unknown>;
    createdAt: string;
  };
  context: {
    tenantId: string;
    agentId?: string;
    conversationId?: string;
    metrics?: MetricSnapshot;
  };
  rule?: {
    id: string;
    name: string;
  };
}

class WebhookService {
  private retryDelays = [1000, 5000, 30000, 60000, 300000]; // 1s, 5s, 30s, 1m, 5m
  
  /**
   * Process an alert and deliver to matching webhook configs
   */
  async processAlert(alert: IAlert, metrics?: MetricSnapshot): Promise<void> {
    try {
      const configs = await this.getActiveConfigs(alert.tenantId || 'default');
      
      for (const config of configs) {
        await this.evaluateAndDeliver(config, alert, metrics);
      }
    } catch (error) {
      logger.error('Failed to process alert for webhooks', { 
        alertId: alert._id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  /**
   * Get all active webhook configs for a tenant
   */
  async getActiveConfigs(tenantId: string): Promise<IWebhookConfig[]> {
    return WebhookConfigModel.find({
      tenantId,
      enabled: true,
    }).exec();
  }
  
  /**
   * Evaluate alert against config rules and deliver if matched
   */
  private async evaluateAndDeliver(
    config: IWebhookConfig,
    alert: IAlert,
    metrics?: MetricSnapshot
  ): Promise<void> {
    // Check rate limiting
    if (!await this.checkRateLimit(config)) {
      logger.debug('Rate limited, skipping webhook', { configId: config._id });
      return;
    }
    
    // Check severity filter
    if (config.severityFilter && config.severityFilter.length > 0) {
      if (!config.severityFilter.includes(alert.severity as any)) {
        return;
      }
    }
    
    // Check event type filter
    if (config.eventTypes && config.eventTypes.length > 0) {
      if (!config.eventTypes.includes(alert.type)) {
        return;
      }
    }
    
    // Evaluate rules (if any)
    let matchedRule: AlertRule | undefined;
    if (config.rules && config.rules.length > 0) {
      matchedRule = this.evaluateRules(config.rules, metrics || {}, alert);
      if (!matchedRule) {
        return; // No rule matched
      }
    }
    
    // Deliver to all channels
    if (config.channels) {
      for (const channel of config.channels) {
        await this.deliverToChannel(config, channel, alert, matchedRule, metrics);
      }
    }
  }
  
  /**
   * Evaluate alert rules against current metrics
   */
  evaluateRules(
    rules: AlertRule[],
    metrics: MetricSnapshot,
    alert: IAlert
  ): AlertRule | undefined {
    for (const rule of rules) {
      if (!rule.enabled) continue;
      
      // Check if alert severity matches rule severity
      if (rule.severity && rule.severity !== alert.severity) continue;
      
      // Evaluate all conditions (handle both conditions array and single condition)
      const conditions = rule.conditions || (rule.condition ? [rule.condition] : []);
      if (conditions.length === 0) continue;
      
      const conditionsMet = conditions.every(condition => 
        this.evaluateCondition(condition, metrics)
      );
      
      if (conditionsMet) {
        return rule;
      }
    }
    
    return undefined;
  }
  
  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: AlertRuleCondition, metrics: MetricSnapshot): boolean {
    const value = metrics[condition.field];
    if (value === undefined) return false;
    
    // Use threshold if available, otherwise use value from condition
    const threshold = condition.threshold ?? (typeof condition.value === 'number' ? condition.value : 0);
    
    switch (condition.operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      case 'contains': return String(value).includes(String(condition.value));
      case 'in': return Array.isArray(condition.value) && condition.value.includes(String(value));
      default: return false;
    }
  }
  
  /**
   * Check rate limiting for a config
   */
  private async checkRateLimit(config: IWebhookConfig): Promise<boolean> {
    const rateLimiting = config.rateLimiting;
    if (!rateLimiting || !(rateLimiting as { enabled?: boolean }).enabled) {
      return true;
    }
    const { maxPerMinute = 60, maxPerHour = 1000 } = rateLimiting as { maxPerMinute?: number; maxPerHour?: number };
    
    // Check minute limit
    const minuteAgo = new Date(Date.now() - 60000);
    const minuteCount = await WebhookDeliveryModel.countDocuments({
      webhookConfigId: config._id,
      createdAt: { $gte: minuteAgo },
    });
    if (minuteCount >= maxPerMinute) return false;
    
    // Check hour limit
    const hourAgo = new Date(Date.now() - 3600000);
    const hourCount = await WebhookDeliveryModel.countDocuments({
      webhookConfigId: config._id,
      createdAt: { $gte: hourAgo },
    });
    if (hourCount >= maxPerHour) return false;
    
    return true;
  }
  
  /**
   * Deliver alert to a specific channel
   */
  private async deliverToChannel(
    config: IWebhookConfig,
    channel: WebhookChannelConfig,
    alert: IAlert,
    rule?: AlertRule,
    metrics?: MetricSnapshot
  ): Promise<void> {
    const payload = this.buildPayload(alert, config.tenantId, rule, metrics);
    const formattedPayload = this.formatForChannel(channel, payload);
    
    // Create delivery record
    const delivery = await WebhookDeliveryModel.create({
      tenantId: config.tenantId,
      webhookConfigId: config._id,
      alertId: alert._id,
      alertType: alert.type,
      alertSeverity: alert.severity,
      ruleId: rule?.id,
      ruleName: rule?.name,
      status: 'pending',
      url: channel.url,
      method: channel.method || 'POST',
      requestBody: JSON.stringify(formattedPayload),
      requestHeaders: this.buildHeaders(config, channel, formattedPayload),
      attempt: 1,
      maxAttempts: config.retryConfig?.maxRetries ?? 3,
    });
    
    // Attempt delivery
    await this.attemptDelivery(delivery, config);
  }
  
  /**
   * Build standard webhook payload
   */
  private buildPayload(
    alert: IAlert,
    tenantId: string,
    rule?: AlertRule,
    metrics?: MetricSnapshot
  ): WebhookPayload {
    return {
      event: 'alert.triggered',
      timestamp: new Date().toISOString(),
      alert: {
        id: (alert._id as mongoose.Types.ObjectId).toString(),
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        details: alert.details as Record<string, unknown>,
        createdAt: alert.timestamp.toISOString(),
      },
      context: {
        tenantId,
        agentId: alert.agentId,
        conversationId: alert.conversationId,
        metrics,
      },
      ...(rule && {
        rule: {
          id: rule.id,
          name: rule.name,
        },
      }),
    };
  }
  
  /**
   * Format payload for specific channel types
   */
  private formatForChannel(
    channel: WebhookChannelConfig,
    payload: WebhookPayload
  ): Record<string, unknown> {
    const alert = payload.alert;
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    
    switch (channel.type) {
      case 'slack':
        return {
          text: `${severityEmoji} *${alert.title}*`,
          attachments: [{
            color: this.getSeverityColor(alert.severity),
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Type', value: alert.type, short: true },
              { title: 'Description', value: alert.description, short: false },
            ],
            footer: `Yseeku Alert | ${payload.timestamp}`,
          }],
        };
        
      case 'discord':
        return {
          embeds: [{
            title: `${severityEmoji} ${alert.title}`,
            description: alert.description,
            color: parseInt(this.getSeverityColor(alert.severity).replace('#', ''), 16),
            fields: [
              { name: 'Severity', value: alert.severity, inline: true },
              { name: 'Type', value: alert.type, inline: true },
            ],
            timestamp: payload.timestamp,
            footer: { text: 'Yseeku Platform' },
          }],
        };
        
      case 'teams':
        return {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: this.getSeverityColor(alert.severity).replace('#', ''),
          summary: alert.title,
          sections: [{
            activityTitle: `${severityEmoji} ${alert.title}`,
            facts: [
              { name: 'Severity', value: alert.severity },
              { name: 'Type', value: alert.type },
              { name: 'Description', value: alert.description },
            ],
          }],
        };
        
      case 'pagerduty':
        return {
          routing_key: channel.headers?.['routing-key'] || '',
          event_action: 'trigger',
          dedup_key: `yseeku-${alert.id}`,
          payload: {
            summary: alert.title,
            severity: this.mapToPagerDutySeverity(alert.severity),
            source: 'yseeku-platform',
            custom_details: {
              description: alert.description,
              type: alert.type,
              metrics: payload.context.metrics,
            },
          },
        };
        
      case 'email':
        // Email would be handled by a separate email service
        return {
          to: channel.url, // URL is email address for email type
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          html: this.buildEmailHtml(payload),
        };
        
      case 'webhook':
      default:
        return payload as unknown as Record<string, unknown>;
    }
  }
  
  /**
   * Build request headers
   */
  private buildHeaders(
    config: IWebhookConfig,
    channel: WebhookChannelConfig,
    payload: Record<string, unknown>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Yseeku-Webhook/1.0',
      ...channel.headers,
    };
    
    // Add signature if secret configured
    if (config.secret) {
      const body = JSON.stringify(payload);
      const signature = this.signPayload(body, config.secret);
      headers['X-Yseeku-Signature'] = signature;
      headers['X-Yseeku-Timestamp'] = Date.now().toString();
    }
    
    return headers;
  }
  
  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(body: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }
  
  /**
   * Attempt to deliver a webhook
   */
  async attemptDelivery(delivery: IWebhookDelivery, config: IWebhookConfig): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(delivery.url, {
        method: delivery.method,
        headers: delivery.requestHeaders as Record<string, string>,
        body: delivery.requestBody,
        signal: AbortSignal.timeout(config.retryConfig?.timeoutMs ?? 30000),
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();
      
      if (response.ok) {
        // Success!
        await WebhookDeliveryModel.findByIdAndUpdate(delivery._id, {
          status: 'success',
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 10000), // Limit stored response
          responseTime,
          deliveredAt: new Date(),
        });
        
        logger.info('Webhook delivered successfully', {
          deliveryId: delivery._id,
          url: delivery.url,
          responseTime,
        });
        
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${responseBody.slice(0, 500)}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseTime = Date.now() - startTime;
      
      logger.warn('Webhook delivery failed', {
        deliveryId: delivery._id,
        attempt: delivery.attempt,
        error: errorMessage,
      });
      
      // Schedule retry or mark as failed
      if (delivery.attempt < delivery.maxAttempts) {
        const retryDelay = this.retryDelays[delivery.attempt - 1] || 300000;
        const nextRetryAt = new Date(Date.now() + retryDelay);
        
        await WebhookDeliveryModel.findByIdAndUpdate(delivery._id, {
          status: 'retrying',
          attempt: delivery.attempt + 1,
          nextRetryAt,
          responseTime,
          error: errorMessage,
        });
        
        // Schedule retry (in production, use a job queue)
        setTimeout(() => this.processRetry(delivery._id!.toString()), retryDelay);
      } else {
        await WebhookDeliveryModel.findByIdAndUpdate(delivery._id, {
          status: 'failed',
          responseTime,
          error: errorMessage,
        });
        
        logger.error('Webhook delivery permanently failed', {
          deliveryId: delivery._id,
          attempts: delivery.attempt,
        });
      }
      
      return false;
    }
  }
  
  /**
   * Process a retry from the queue
   */
  async processRetry(deliveryId: string): Promise<void> {
    const delivery = await WebhookDeliveryModel.findById(deliveryId);
    if (!delivery || delivery.status !== 'retrying') return;
    
    const config = await WebhookConfigModel.findById(delivery.webhookConfigId);
    if (!config || !config.enabled) {
      await WebhookDeliveryModel.findByIdAndUpdate(deliveryId, { status: 'failed' });
      return;
    }
    
    await this.attemptDelivery(delivery, config);
  }
  
  /**
   * Process pending retries (called by scheduler)
   */
  async processPendingRetries(): Promise<number> {
    const now = new Date();
    const pending = await WebhookDeliveryModel.find({
      status: 'retrying',
      nextRetryAt: { $lte: now },
    }).limit(100);
    
    let processed = 0;
    for (const delivery of pending) {
      await this.processRetry(delivery._id!.toString());
      processed++;
    }
    
    return processed;
  }
  
  // ==================== CRUD Operations ====================
  
  /**
   * Create a new webhook configuration
   */
  async createConfig(data: Partial<IWebhookConfig>): Promise<IWebhookConfig> {
    const config = await WebhookConfigModel.create(data);
    logger.info('Webhook config created', { configId: config._id, name: config.name });
    return config;
  }
  
  /**
   * Update a webhook configuration
   */
  async updateConfig(id: string, data: Partial<IWebhookConfig>): Promise<IWebhookConfig | null> {
    const config = await WebhookConfigModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    if (config) {
      logger.info('Webhook config updated', { configId: id });
    }
    return config;
  }
  
  /**
   * Delete a webhook configuration
   */
  async deleteConfig(id: string): Promise<boolean> {
    const result = await WebhookConfigModel.findByIdAndDelete(id);
    if (result) {
      logger.info('Webhook config deleted', { configId: id });
      return true;
    }
    return false;
  }
  
  /**
   * Get webhook config by ID
   */
  async getConfig(id: string): Promise<IWebhookConfig | null> {
    return WebhookConfigModel.findById(id);
  }
  
  /**
   * List webhook configs for tenant
   */
  async listConfigs(tenantId: string): Promise<IWebhookConfig[]> {
    return WebhookConfigModel.find({ tenantId }).sort({ createdAt: -1 });
  }
  
  /**
   * Get delivery history for a config
   */
  async getDeliveryHistory(
    configId: string,
    limit = 50
  ): Promise<IWebhookDelivery[]> {
    return WebhookDeliveryModel
      .find({ webhookConfigId: configId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Get delivery stats for a config
   */
  async getDeliveryStats(configId: string, hours = 24): Promise<{
    total: number;
    success: number;
    failed: number;
    retrying: number;
    avgResponseTime: number;
  }> {
    const since = new Date(Date.now() - hours * 3600000);
    
    const [stats] = await WebhookDeliveryModel.aggregate([
      {
        $match: {
          webhookConfigId: new mongoose.Types.ObjectId(configId),
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          retrying: {
            $sum: { $cond: [{ $eq: ['$status', 'retrying'] }, 1, 0] },
          },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);
    
    return stats || {
      total: 0,
      success: 0,
      failed: 0,
      retrying: 0,
      avgResponseTime: 0,
    };
  }
  
  /**
   * Test a webhook configuration
   */
  async testWebhook(configId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const config = await WebhookConfigModel.findById(configId);
    if (!config || !config.channels || config.channels.length === 0) {
      return { success: false, responseTime: 0, error: 'Config not found or no channels' };
    }
    
    const testPayload: WebhookPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      alert: {
        id: 'test-' + Date.now(),
        type: 'test',
        title: 'Test Webhook',
        description: 'This is a test webhook from Yseeku Platform',
        severity: 'info',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      context: {
        tenantId: config.tenantId,
      },
    };
    
    const channel = config.channels[0];
    const formattedPayload = this.formatForChannel(channel, testPayload);
    const headers = this.buildHeaders(config, channel, formattedPayload);
    
    const startTime = Date.now();
    
    // Get channel URL - handle both object and string channel types
    const channelUrl = typeof channel === 'string' ? config.url : (channel as WebhookChannelConfig).url || config.url;
    const channelMethod = typeof channel === 'string' ? 'POST' : (channel as WebhookChannelConfig).method || 'POST';
    
    try {
      const response = await fetch(channelUrl, {
        method: channelMethod,
        headers,
        body: JSON.stringify(formattedPayload),
        signal: AbortSignal.timeout(10000),
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return { success: true, responseTime };
      } else {
        const body = await response.text();
        return {
          success: false,
          responseTime,
          error: `HTTP ${response.status}: ${body.slice(0, 200)}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Helper Methods ====================

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🚨',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return emojis[severity] || '📢';
  }

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: '#FF0000',
      error: '#FF4444',
      warning: '#FFA500',
      info: '#0088FF',
    };
    return colors[severity] || '#808080';
  }

  private mapToPagerDutySeverity(severity: string): string {
    const mapping: Record<string, string> = {
      critical: 'critical',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return mapping[severity] || 'info';
  }

  private buildEmailHtml(payload: WebhookPayload): string {
    const alert = payload.alert;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${this.getSeverityEmoji(alert.severity)} ${alert.title}</h2>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Description:</strong> ${alert.description}</p>
          <p style="color: #666; font-size: 12px;">Timestamp: ${payload.timestamp}</p>
        </div>
      </div>
    `;
  }
}

export const webhookService = new WebhookService();
