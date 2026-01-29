"use strict";
/**
 * Webhook Manager for SONATE Platform
 *
 * Real-time webhook alerts for trust violations and system events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookManager = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
/**
 * Webhook Manager class
 */
class WebhookManager {
    constructor(config) {
        this.webhooks = new Map();
        this.deliveryQueue = [];
        this.processing = false;
        this.rateLimiters = new Map();
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
            eventsByType: {},
            errorsByType: {},
            lastUpdated: Date.now()
        };
    }
    /**
     * Register a new webhook
     */
    async registerWebhook(request) {
        // Validate request
        this.validateRegistrationRequest(request);
        // Generate secret if not provided
        const secret = request.secret || this.generateSecret();
        // Create webhook config
        const webhook = {
            id: (0, uuid_1.v4)(),
            name: request.name,
            url: request.url,
            secret,
            events: request.events,
            enabled: true,
            retryPolicy: {
                maxAttempts: request.retryPolicy?.maxAttempts ?? this.config.defaultRetryPolicy.maxAttempts,
                backoffStrategy: request.retryPolicy?.backoffStrategy ?? this.config.defaultRetryPolicy.backoffStrategy,
                initialDelay: request.retryPolicy?.initialDelay ?? this.config.defaultRetryPolicy.initialDelay,
                maxDelay: request.retryPolicy?.maxDelay ?? this.config.defaultRetryPolicy.maxDelay,
                retryableErrors: request.retryPolicy?.retryableErrors ?? this.config.defaultRetryPolicy.retryableErrors
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
    async updateWebhook(webhookId, request) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) {
            throw new Error(`Webhook not found: ${webhookId}`);
        }
        // Update webhook
        const updatedWebhook = {
            ...webhook,
            name: request.name ?? webhook.name,
            url: request.url ?? webhook.url,
            events: request.events ?? webhook.events,
            secret: request.secret ?? webhook.secret,
            enabled: request.enabled ?? webhook.enabled,
            headers: request.headers ?? webhook.headers,
            filters: request.filters ?? webhook.filters,
            rateLimit: request.rateLimit ?? webhook.rateLimit,
            retryPolicy: request.retryPolicy ? {
                maxAttempts: request.retryPolicy.maxAttempts ?? webhook.retryPolicy.maxAttempts,
                backoffStrategy: request.retryPolicy.backoffStrategy ?? webhook.retryPolicy.backoffStrategy,
                initialDelay: request.retryPolicy.initialDelay ?? webhook.retryPolicy.initialDelay,
                maxDelay: request.retryPolicy.maxDelay ?? webhook.retryPolicy.maxDelay,
                retryableErrors: request.retryPolicy.retryableErrors ?? webhook.retryPolicy.retryableErrors
            } : webhook.retryPolicy,
            metadata: {
                ...webhook.metadata,
                lastUpdated: Date.now(),
                description: request.metadata?.description ?? webhook.metadata.description,
                tags: request.metadata?.tags ?? webhook.metadata.tags
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
    async deleteWebhook(webhookId) {
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
    async sendAlert(request) {
        const eventId = (0, uuid_1.v4)();
        const timestamp = Date.now();
        // Create event
        const event = {
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
        const results = [];
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
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Get webhook by ID
     */
    getWebhook(webhookId) {
        return this.webhooks.get(webhookId);
    }
    /**
     * List all webhooks
     */
    listWebhooks() {
        return Array.from(this.webhooks.values());
    }
    /**
     * Test webhook delivery
     */
    async testWebhook(webhookId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) {
            throw new Error(`Webhook not found: ${webhookId}`);
        }
        // Create test event
        const testEvent = {
            id: (0, uuid_1.v4)(),
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
                eventId: (0, uuid_1.v4)(),
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
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        try {
            while (this.deliveryQueue.length > 0) {
                const batch = this.deliveryQueue.splice(0, this.config.batchSize);
                // Process batch concurrently
                const promises = batch.map(event => {
                    const webhooks = Array.from(this.webhooks.values()).filter((w) => w.enabled && this.matchesWebhook(event, w));
                    return Promise.all(webhooks.map((webhook) => this.deliverEvent(event, webhook)));
                });
                await Promise.all(promises);
            }
        }
        finally {
            this.processing = false;
        }
    }
    /**
     * Deliver event to webhook
     */
    async deliverEvent(event, webhook) {
        const startTime = Date.now();
        let attempt = 0;
        let lastError = undefined;
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
                const axiosResponse = await this.sendHttpRequest(signedEvent, webhook);
                const duration = Date.now() - startTime;
                // Convert to WebhookResponse
                const response = {
                    status: axiosResponse.status,
                    statusText: axiosResponse.statusText,
                    headers: axiosResponse.headers,
                    body: typeof axiosResponse.data === 'string' ? axiosResponse.data : JSON.stringify(axiosResponse.data),
                    duration
                };
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
            }
            catch (error) {
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
        if (lastError) {
            const errorType = lastError.type;
            this.statistics.errorsByType[errorType] = (this.statistics.errorsByType[errorType] || 0) + 1;
        }
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
    async sendHttpRequest(event, webhook) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Sonate-Webhook-Alerts/1.0.0',
            'X-Webhook-Event-ID': event.id,
            'X-Webhook-Timestamp': event.timestamp.toString(),
            'X-Webhook-Signature': event.signature,
            ...webhook.headers
        };
        return axios_1.default.post(webhook.url, event, {
            headers,
            timeout: webhook.timeout,
            validateStatus: (status) => status >= 200 && status < 500
        });
    }
    /**
     * Find webhooks matching event
     */
    findMatchingWebhooks(event, filters) {
        return Array.from(this.webhooks.values()).filter(webhook => webhook.enabled &&
            webhook.events.includes(event.type) &&
            this.matchesWebhook(event, webhook) &&
            this.matchesFilters(event, filters || []));
    }
    /**
     * Check if webhook matches event
     */
    matchesWebhook(event, webhook) {
        return webhook.filters.every(filter => this.matchesFilter(event, filter));
    }
    /**
     * Check if event matches filters
     */
    matchesFilters(event, filters) {
        return filters.every(filter => this.matchesFilter(event, filter));
    }
    /**
     * Check if event matches filter
     */
    matchesFilter(event, filter) {
        if (!filter.enabled)
            return true;
        const value = this.getFieldValue(event, filter.field);
        return this.compareValues(value, filter.operator, filter.value);
    }
    /**
     * Get field value from event
     */
    getFieldValue(event, field) {
        const parts = field.split('.');
        let current = event;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    /**
     * Compare values using operator
     */
    compareValues(actual, operator, expected) {
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
    createWebhookEventForWebhook(event, webhook) {
        const webhookEvent = { ...event };
        webhookEvent.signature = this.signEvent(webhookEvent, webhook.secret);
        return webhookEvent;
    }
    /**
     * Sign event with webhook secret
     */
    signEvent(event, secret) {
        const payload = JSON.stringify(event);
        return crypto_js_1.default.HmacSHA256(payload, secret).toString();
    }
    /**
     * Get event priority
     */
    getEventPriority(type) {
        const priorityMap = {
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
    parseError(error) {
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
    isRetryableError(errorType, retryableErrors) {
        return retryableErrors.includes(errorType);
    }
    /**
     * Calculate retry delay
     */
    calculateRetryDelay(attempt, retryPolicy) {
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Update average delivery time
     */
    updateAverageDeliveryTime(duration) {
        const total = this.statistics.successfulDeliveries;
        const current = this.statistics.averageDeliveryTime;
        this.statistics.averageDeliveryTime = ((current * (total - 1)) + duration) / total;
    }
    /**
     * Generate secret
     */
    generateSecret() {
        return crypto_js_1.default.lib.WordArray.random(32).toString();
    }
    /**
     * Validate registration request
     */
    validateRegistrationRequest(request) {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1).max(255),
            url: zod_1.z.string().url(),
            events: zod_1.z.array(zod_1.z.enum([
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
            secret: zod_1.z.string().min(32).max(256).optional(),
            headers: zod_1.z.object({}).catchall(zod_1.z.string()).optional(),
            retryPolicy: zod_1.z.object({
                maxAttempts: zod_1.z.number().min(1).max(10).optional(),
                backoffStrategy: zod_1.z.enum(['fixed', 'linear', 'exponential', 'exponential_with_jitter']).optional(),
                initialDelay: zod_1.z.number().min(100).max(60000).optional(),
                maxDelay: zod_1.z.number().min(1000).max(300000).optional(),
                retryableErrors: zod_1.z.array(zod_1.z.string()).optional()
            }).optional(),
            filters: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                field: zod_1.z.string(),
                operator: zod_1.z.enum([
                    'equals', 'not_equals', 'contains', 'not_contains',
                    'greater_than', 'less_than', 'greater_equal', 'less_equal',
                    'in', 'not_in', 'regex'
                ]),
                value: zod_1.z.any(),
                enabled: zod_1.z.boolean()
            })).optional(),
            rateLimit: zod_1.z.object({
                maxRequests: zod_1.z.number().min(1),
                windowMs: zod_1.z.number().min(1000),
                strategy: zod_1.z.enum(['sliding_window', 'fixed_window', 'token_bucket'])
            }).optional(),
            metadata: zod_1.z.object({
                description: zod_1.z.string().optional(),
                tags: zod_1.z.array(zod_1.z.string()).optional()
            }).optional()
        });
        schema.parse(request);
    }
    /**
     * Validate webhook configuration
     */
    validateWebhook(webhook) {
        const schema = zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().min(1).max(255),
            url: zod_1.z.string().url(),
            secret: zod_1.z.string().min(32).max(256),
            events: zod_1.z.array(zod_1.z.string()).min(1),
            enabled: zod_1.z.boolean(),
            retryPolicy: zod_1.z.object({
                maxAttempts: zod_1.z.number().min(1).max(10),
                backoffStrategy: zod_1.z.enum(['fixed', 'linear', 'exponential', 'exponential_with_jitter']),
                initialDelay: zod_1.z.number().min(100).max(60000),
                maxDelay: zod_1.z.number().min(1000).max(300000),
                retryableErrors: zod_1.z.array(zod_1.z.string())
            }),
            filters: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                field: zod_1.z.string(),
                operator: zod_1.z.enum([
                    'equals', 'not_equals', 'contains', 'not_contains',
                    'greater_than', 'less_than', 'greater_equal', 'less_equal',
                    'in', 'not_in', 'regex'
                ]),
                value: zod_1.z.any(),
                enabled: zod_1.z.boolean()
            })),
            timeout: zod_1.z.number().min(1000).max(300000),
            metadata: zod_1.z.object({
                created: zod_1.z.number(),
                lastUpdated: zod_1.z.number(),
                created_by: zod_1.z.string(),
                version: zod_1.z.string(),
                tags: zod_1.z.array(zod_1.z.string()),
                description: zod_1.z.string().optional()
            })
        });
        schema.parse(webhook);
    }
}
exports.WebhookManager = WebhookManager;
/**
 * Rate limiter for webhook delivery
 */
class RateLimiter {
    constructor(config) {
        this.requests = [];
        this.config = config;
    }
    checkLimit() {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        // Remove old requests outside window
        this.requests = this.requests.filter(timestamp => timestamp > windowStart);
        // Check if under limit
        return this.requests.length < this.config.maxRequests;
    }
    recordRequest() {
        this.requests.push(Date.now());
    }
}
