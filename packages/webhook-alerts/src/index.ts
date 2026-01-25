/**
 * @sonate/webhook-alerts - Real-time Webhook Alerts
 *
 * Real-time webhook alerts for SONATE platform trust violations and system events
 */

// Core webhook manager
export { WebhookManager } from './webhook-manager';

// Types and interfaces
export * from './types';

// Alert generators
export { TrustViolationAlertGenerator } from './alerts/trust-violation-generator';
