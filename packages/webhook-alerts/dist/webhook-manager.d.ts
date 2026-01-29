/**
 * Webhook Manager for SONATE Platform
 *
 * Real-time webhook alerts for trust violations and system events
 */
import { WebhookConfig, WebhookAlertRequest, WebhookRegistrationRequest, WebhookUpdateRequest, WebhookDeliveryResult, WebhookStatistics, WebhookManagerConfig } from './types';
/**
 * Webhook Manager class
 */
export declare class WebhookManager {
    private webhooks;
    private deliveryQueue;
    private processing;
    private config;
    private statistics;
    private rateLimiters;
    constructor(config?: Partial<WebhookManagerConfig>);
    /**
     * Register a new webhook
     */
    registerWebhook(request: WebhookRegistrationRequest): Promise<WebhookConfig>;
    /**
     * Update an existing webhook
     */
    updateWebhook(webhookId: string, request: WebhookUpdateRequest): Promise<WebhookConfig>;
    /**
     * Delete a webhook
     */
    deleteWebhook(webhookId: string): Promise<void>;
    /**
     * Send an alert to matching webhooks
     */
    sendAlert(request: WebhookAlertRequest): Promise<WebhookDeliveryResult[]>;
    /**
     * Get webhook statistics
     */
    getStatistics(): WebhookStatistics;
    /**
     * Get webhook by ID
     */
    getWebhook(webhookId: string): WebhookConfig | undefined;
    /**
     * List all webhooks
     */
    listWebhooks(): WebhookConfig[];
    /**
     * Test webhook delivery
     */
    testWebhook(webhookId: string): Promise<WebhookDeliveryResult>;
    /**
     * Process delivery queue
     */
    private processQueue;
    /**
     * Deliver event to webhook
     */
    private deliverEvent;
    /**
     * Send HTTP request
     */
    private sendHttpRequest;
    /**
     * Find webhooks matching event
     */
    private findMatchingWebhooks;
    /**
     * Check if webhook matches event
     */
    private matchesWebhook;
    /**
     * Check if event matches filters
     */
    private matchesFilters;
    /**
     * Check if event matches filter
     */
    private matchesFilter;
    /**
     * Get field value from event
     */
    private getFieldValue;
    /**
     * Compare values using operator
     */
    private compareValues;
    /**
     * Create webhook event for specific webhook
     */
    private createWebhookEventForWebhook;
    /**
     * Sign event with webhook secret
     */
    private signEvent;
    /**
     * Get event priority
     */
    private getEventPriority;
    /**
     * Parse error from exception
     */
    private parseError;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Calculate retry delay
     */
    private calculateRetryDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Update average delivery time
     */
    private updateAverageDeliveryTime;
    /**
     * Generate secret
     */
    private generateSecret;
    /**
     * Validate registration request
     */
    private validateRegistrationRequest;
    /**
     * Validate webhook configuration
     */
    private validateWebhook;
}
