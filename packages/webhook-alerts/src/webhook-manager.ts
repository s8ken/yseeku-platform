/**
 * Webhook Manager for SONATE Platform
 * 
 * Real-time webhook alerts for trust violations and system events
 */

import axios, { AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
  WebhookConfig,
  WebhookEvent,
  WebhookEventType,
  WebhookAlertRequest,
  WebhookRegistrationRequest,
  WebhookUpdateRequest,
  WebhookDeliveryResult,
  WebhookStatistics,
  WebhookManagerConfig,
  DeliveryStatus,
  ErrorType,
  EventPriority,
  BackoffStrategy,
  WebhookFilter,
  FilterOperator
} from './types';

/**
 * Webhook Manager class
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryQueue: WebhookEvent[] = [];
  private processing = false;
  private config: WebhookManagerConfig;
  private statistics: WebhookStatistics;
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(config?: Partial<WebhookManagerConfig>) {
    this.config = {
      defaultTimeout: 30000, // 30 seconds
      maxConcurrentDeliveries: 10,
      defaultRetryPolicy: {
        maxAttempts: 3,
        backoffStrategy: 'exponential_with_jitter',
        initialDelay: 1000,
        maxDelay: 60000,
        retryableErrors: ['network_error', 'timeout_error', 'http_error']
      },
      queueSize: 1000,
      batchSize: 10,
      batchTimeout: 5000,
      metricsEnabled: true,
      deadLetterQueue: true,
      ...config
    };

    this.statistics = {
      totalWebhooks: 0,
      activeWebhooks: 0,
      totalEvents: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      eventsByType: {} as Record<WebhookEventType, number>,
      errorsByType: {} as Record<ErrorType, number>,
      lastUpdated: Date.now()
    };
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookConfig> {
    // Validate request
    this.validateRegistrationRequest(request);

    // Generate secret if not provided
    const secret = request.secret || this.generateSecret();

    // Create webhook config
    const webhook: WebhookConfig = {
      id: uuidv4(),
      name: request.name,
      url: request.url,
      secret,
      events: request.events,
      enabled: true,
      retryPolicy: {
        ...this.config.defaultRetryPolicy,
        ...request.retryPolicy
      },
      filters: request.filters || [],
      headers: request.headers,
      timeout: this.config.defaultTimeout,
      rateLimit: request.rateLimit,
      metadata: {
        created: Date.now(),
        lastUpdated: Date.now(),
        created_by: 'system',
        tags: [],
        version: '1.0.0',
        ...request.metadata
      }
    };

    // Validate webhook
    this.validateWebhook(webhook);

    // Store webhook
    this.webhooks.set(webhook.id, webhook);

    // Create rate limiter
    if (webhook.rateLimit) {
      this.rateLimiters.set(webhook.id, new RateLimiter(webhook.rateLimit));
    }

    // Update statistics
    this.statistics.totalWebhooks++;
    this.statistics.activeWebhooks++;
    this.statistics.lastUpdated = Date.now();

    return webhook;
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(webhookId: string, request: WebhookUpdateRequest): Promise<WebhookConfig> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    // Update webhook
    const updatedWebhook: WebhookConfig = {
      ...webhook,
      ...request,
      metadata: {
        ...webhook.metadata,
        lastUpdated: Date.now(),
        ...request.metadata
      }
    };

    // Validate updated webhook
    this.validateWebhook(updatedWebhook);

    // Update rate limiter if needed
    if (request.rateLimit) {
      this.rateLimiters.set(webhookId, new RateLimiter(request.rateLimit));
    }

    // Store updated webhook
    this.webhooks.set(webhookId, updatedWebhook);

    return updatedWebhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    // Remove webhook
    this.webhooks.delete(webhookId);
    this.rateLimiters.delete(webhookId);

    // Update statistics
    this.statistics.activeWebhooks--;
    this.statistics.lastUpdated = Date.now();
  }

  /**
   * Send an alert to matching webhooks
   */
  async sendAlert(request: WebhookAlertRequest): Promise<WebhookDeliveryResult[]> {
    const eventId = uuidv4();
    const timestamp = Date.now();

    // Create event
    const event: WebhookEvent = {
      id: eventId,
      type: request.type,
      timestamp,
      source: 'sonate-platform',
      version: '1.0.0',
      data: request.data,
      signature: '', // Will be set per webhook
      metadata: {
        eventId,
        source: 'sonate-platform',
        version: '1.0.0',
        timestamp,
        processingTime: 0,
        retryCount: 0,
        priority: request.priority || this.getEventPriority(request.type)
      }
    };

    // Find matching webhooks
    const matchingWebhooks = this.findMatchingWebhooks(event, request.filters);

    // Create delivery results
    const results: WebhookDeliveryResult[] = [];

    // Queue events for delivery
    for (const webhook of matchingWebhooks) {
      const webhookEvent = this.createWebhookEventForWebhook(event, webhook);
      this.deliveryQueue.push(webhookEvent);
    }

    // Update statistics
    this.statistics.totalEvents++;
    this.statistics.eventsByType[request.type] = (this.statistics.eventsByType[request.type] || 0) + 1;
    this.statistics.lastUpdated = Date.now();

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return results;
  }

  /**
   * Get webhook statistics
   */
  getStatistics(): WebhookStatistics {
    return { ...this.statistics };
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List all webhooks
   */
  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    // Create test event
    const testEvent: WebhookEvent = {
      id: uuidv4(),
      type: 'trust_violation_warning',
      timestamp: Date.now(),
      source: 'sonate-platform',
      version: '1.0.0',
      data: {
        trustScore: {
          overall: 5.0,
          principles: {
            CONSENT_ARCHITECTURE: 5.0,
            INSPECTION_MANDATE: 5.0,
            CONTINUOUS_VALIDATION: 5.0,
            ETHICAL_OVERRIDE: 5.0,
            RIGHT_TO_DISCONNECT: 5.0,
            MORAL_RECOGNITION: 5.0
          },
          violations: [],
          timestamp: Date.now()
        },
        violation: {
          score: 5.0,
          threshold: 6.0,
          severity: 'warning',
          principles: ['CONSENT_ARCHITECTURE'],
          context: {
            interactionId: 'test-interaction',
            agentId: 'test-agent'
          }
        }
      },
      signature: '', // Will be set below
      metadata: {
        eventId: uuidv4(),
        source: 'sonate-platform',
        version: '1.0.0',
        timestamp: Date.now(),
        processingTime: 0,
        retryCount: 0,
        priority: 'medium'
      }
    };

    // Sign event for this webhook
    testEvent.signature = this.signEvent(testEvent, webhook.secret);

    // Deliver event
    return this.deliverEvent(testEvent, webhook);
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    try {
      while (this.deliveryQueue.length > 0) {
        const batch = this.deliveryQueue.splice(0, this.config.batchSize);
        
        // Process batch concurrently
        const promises = batch.map(event => {
          const webhooks = this.webhooks.values().filter(w => 
            w.enabled && this.matchesWebhook(event, w)
          );
          
          return Promise.all(
            webhooks.map(webhook => this.deliverEvent(event, webhook))
          );
        });

        await Promise.all(promises);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Deliver event to webhook
   */
  private async deliverEvent(event: WebhookEvent, webhook: WebhookConfig): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: WebhookError | undefined;

    while (attempt < webhook.retryPolicy.maxAttempts) {
      attempt++;
      
      try {
        // Check rate limit
        const rateLimiter = this.rateLimiters.get(webhook.id);
        if (rateLimiter && !rateLimiter.checkLimit()) {
          throw new Error('Rate limit exceeded');
        }

        // Create signed event
        const signedEvent = this.createWebhookEventForWebhook(event, webhook);

        // Deliver webhook
        const response = await this.sendHttpRequest(signedEvent, webhook);
        
        const duration = Date.now() - startTime;
        
        // Update statistics
        this.statistics.successfulDeliveries++;
        this.updateAverageDeliveryTime(duration);
        this.statistics.lastUpdated = Date.now();

        return {
          webhookId: webhook.id,
          eventId: event.id,
          status: 'delivered',
          attempt,
          timestamp: Date.now(),
          duration,
          response
        };

      } catch (error) {
        lastError = this.parseError(error);
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError.type, webhook.retryPolicy.retryableErrors)) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt, webhook.retryPolicy);
        
        if (delay > webhook.retryPolicy.maxDelay) {
          break;
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    
    // Update statistics
    this.statistics.failedDeliveries++;
    this.statistics.errorsByType[lastError!.type] = (this.statistics.errorsByType[lastError!.type] || 0) + 1;
    this.statistics.lastUpdated = Date.now();

    return {
      webhookId: webhook.id,
      eventId: event.id,
      status: 'failed',
      attempt,
      timestamp: Date.now(),
      duration,
      error: lastError
    };
  }

  /**
   * Send HTTP request
   */
  private async sendHttpRequest(event: WebhookEvent, webhook: WebhookConfig): Promise<AxiosResponse> {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Sonate-Webhook-Alerts/1.0.0',
      'X-Webhook-Event-ID': event.id,
      'X-Webhook-Timestamp': event.timestamp.toString(),
      'X-Webhook-Signature': event.signature,
      ...webhook.headers
    };

    return axios.post(webhook.url, event, {
      headers,
      timeout: webhook.timeout,
      validateStatus: false
    });
  }

  /**
   * Find webhooks matching event
   */
  private findMatchingWebhooks(event: WebhookEvent, filters?: WebhookFilter[]): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(webhook => 
      webhook.enabled && 
      webhook.events.includes(event.type) &&
      this.matchesWebhook(event, webhook) &&
      this.matchesFilters(event, filters || [])
    );
  }

  /**
   * Check if webhook matches event
   */
  private matchesWebhook(event: WebhookEvent, webhook: WebhookConfig): boolean {
    return webhook.filters.every(filter => this.matchesFilter(event, filter));
  }

  /**
   * Check if event matches filters
   */
  private matchesFilters(event: WebhookEvent, filters: WebhookFilter[]): boolean {
    return filters.every(filter => this.matchesFilter(event, filter));
  }

  /**
   * Check if event matches filter
   */
  private matchesFilter(event: WebhookEvent, filter: WebhookFilter): boolean {
    if (!filter.enabled) return true;

    const value = this.getFieldValue(event, filter.field);
    return this.compareValues(value, filter.operator, filter.value);
  }

  /**
   * Get field value from event
   */
  private getFieldValue(event: WebhookEvent, field: string): any {
    const parts = field.split('.');
    let current: any = event;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Compare values using operator
   */
  private compareValues(actual: any, operator: FilterOperator, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'not_contains':
        return typeof actual === 'string' && !actual.includes(expected);
      case 'greater_than':
        return typeof actual === 'number' && actual > expected;
      case 'less_than':
        return typeof actual === 'number' && actual < expected;
      case 'greater_equal':
        return typeof actual === 'number' && actual >= expected;
      case 'less_equal':
        return typeof actual === 'number' && actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'regex':
        return typeof actual === 'string' && new RegExp(expected).test(actual);
      default:
        return false;
    }
  }

  /**
   * Create webhook event for specific webhook
   */
  private createWebhookEventForWebhook(event: WebhookEvent, webhook: WebhookConfig): WebhookEvent {
    const webhookEvent = { ...event };
    webhookEvent.signature = this.signEvent(webhookEvent, webhook.secret);
    return webhookEvent;
  }

  /**
   * Sign event with webhook secret
   */
  private signEvent(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify(event);
    return CryptoJS.HmacSHA256(payload, secret).toString();
  }

  /**
   * Get event priority
   */
  private getEventPriority(type: WebhookEventType): EventPriority {
    const priorityMap: Record<WebhookEventType, EventPriority> = {
      'trust_violation_critical': 'critical',
      'trust_violation_error': 'high',
      'trust_violation_warning': 'medium',
      'trust_score_below_threshold': 'high',
      'principle_violation': 'medium',
      'emergence_detected': 'high',
      'agent_error': 'medium',
      'agent_offline': 'high',
      'compliance_breach': 'critical',
      'system_error': 'high',
      'performance_degradation': 'medium',
      'security_incident': 'critical',
      'audit_required': 'medium'
    };

    return priorityMap[type] || 'medium';
  }

  /**
   * Parse error from exception
   */
  private parseError(error: any): WebhookError {
    if (error.response) {
      return {
        type: 'http_error',
        message: error.response.statusText || 'HTTP error',
        code: error.response.status?.toString(),
        originalError: error
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        type: 'network_error',
        message: 'Connection aborted',
        originalError: error
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        type: 'timeout_error',
        message: 'Request timeout',
        originalError: error
      };
    }

    return {
      type: 'unknown_error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      originalError: error
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorType: ErrorType, retryableErrors: string[]): boolean {
    return retryableErrors.includes(errorType);
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    const { backoffStrategy, initialDelay, maxDelay } = retryPolicy;

    switch (backoffStrategy) {
      case 'fixed':
        return initialDelay;
      case 'linear':
        return Math.min(initialDelay * attempt, maxDelay);
      case 'exponential':
        return Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      case 'exponential_with_jitter':
        const exponentialDelay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return exponentialDelay + jitter;
      default:
        return initialDelay;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update average delivery time
   */
  private updateAverageDeliveryTime(duration: number): void {
    const total = this.statistics.successfulDeliveries;
    const current = this.statistics.averageDeliveryTime;
    this.statistics.averageDeliveryTime = ((current * (total - 1)) + duration) / total;
  }

  /**
   * Generate secret
   */
  private generateSecret(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  /**
   * Validate registration request
   */
  private validateRegistrationRequest(request: WebhookRegistrationRequest): void {
    const schema = z.object({
      name: z.string().min(1).max(255),
      url: z.string().url(),
      events: z.array(z.enum([
        'trust_violation_critical',
        'trust_violation_error',
        'trust_violation_warning',
        'trust_score_below_threshold',
        'principle_violation',
        'emergence_detected',
        'agent_error',
        'agent_offline',
        'compliance_breach',
        'system_error',
        'performance_degradation',
        'security_incident',
        'audit_required'
      ])).min(1),
      secret: z.string().min(32).max(256).optional(),
      headers: z.record(z.string()).optional(),
      retryPolicy: z.object({
        maxAttempts: z.number().min(1).max(10).optional(),
        backoffStrategy: z.enum(['fixed', 'linear', 'exponential', 'exponential_with_jitter']).optional(),
        initialDelay: z.number().min(100).max(60000).optional(),
        maxDelay: z.number().min(1000).max(300000).optional(),
        retryableErrors: z.array(z.string()).optional()
      }).optional(),
      filters: z.array(z.object({
        id: z.string(),
        field: z.string(),
        operator: z.enum([
          'equals', 'not_equals', 'contains', 'not_contains',
          'greater_than', 'less_than', 'greater_equal', 'less_equal',
          'in', 'not_in', 'regex'
        ]),
        value: z.any(),
        enabled: z.boolean()
      })).optional(),
      rateLimit: z.object({
        maxRequests: z.number().min(1),
        windowMs: z.number().min(1000),
        strategy: z.enum(['sliding_window', 'fixed_window', 'token_bucket'])
      }).optional(),
      metadata: z.object({
        description: z.string().optional(),
        tags: z.array(z.string()).optional()
      }).optional()
    });

    schema.parse(request);
  }

  /**
   * Validate webhook configuration
   */
  private validateWebhook(webhook: WebhookConfig): void {
    const schema = z.object({
      id: z.string(),
      name: z.string().min(1).max(255),
      url: z.string().url(),
      secret: z.string().min(32).max(256),
      events: z.array(z.string()).min(1),
      enabled: z.boolean(),
      retryPolicy: z.object({
        maxAttempts: z.number().min(1).max(10),
        backoffStrategy: z.enum(['fixed', 'linear', 'exponential', 'exponential_with_jitter']),
        initialDelay: z.number().min(100).max(60000),
        maxDelay: z.number().min(1000).max(300000),
        retryableErrors: z.array(z.string())
      }),
      filters: z.array(z.object({
        id: z.string(),
        field: z.string(),
        operator: z.enum([
          'equals', 'not_equals', 'contains', 'not_contains',
          'greater_than', 'less_than', 'greater_equal', 'less_equal',
          'in', 'not_in', 'regex'
        ]),
        value: z.any(),
        enabled: z.boolean()
      })),
      timeout: z.number().min(1000).max(300000),
      metadata: z.object({
        created: z.number(),
        lastUpdated: z.number(),
        created_by: z.string(),
        version: z.string(),
        tags: z.array(z.string()),
        description: z.string().optional()
      })
    });

    schema.parse(webhook);
  }
}

/**
 * Rate limiter for webhook delivery
 */
class RateLimiter {
  private requests: number[] = [];
  private config: {
    maxRequests: number;
    windowMs: number;
    strategy: string;
  };

  constructor(config: { maxRequests: number; windowMs: number; strategy: string }) {
    this.config = config;
  }

  checkLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    return this.requests.length < this.config.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}
