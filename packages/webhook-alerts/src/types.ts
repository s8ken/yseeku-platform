/**
 * Webhook Alerts Types for SONATE Platform
 */

// Import from @sonate/core
import { TrustScore, TrustPrincipleKey } from '@sonate/core';

// Re-export for consumers
export { TrustScore, TrustPrincipleKey };

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  retryPolicy: RetryPolicy;
  filters: WebhookFilter[];
  headers?: Record<string, string>;
  timeout: number;
  rateLimit?: RateLimit;
  metadata: WebhookMetadata;
}

/**
 * Webhook event types
 */
export type WebhookEventType = 
  | 'trust_violation_critical'
  | 'trust_violation_error'
  | 'trust_violation_warning'
  | 'trust_score_below_threshold'
  | 'principle_violation'
  | 'emergence_detected'
  | 'agent_error'
  | 'agent_offline'
  | 'compliance_breach'
  | 'system_error'
  | 'performance_degradation'
  | 'security_incident'
  | 'audit_required';

/**
 * Webhook filter configuration
 */
export interface WebhookFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  enabled: boolean;
}

/**
 * Filter operators
 */
export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'in'
  | 'not_in'
  | 'regex';

/**
 * Retry policy
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

/**
 * Backoff strategies
 */
export type BackoffStrategy = 
  | 'fixed'
  | 'linear'
  | 'exponential'
  | 'exponential_with_jitter';

/**
 * Rate limiting
 */
export interface RateLimit {
  maxRequests: number;
  windowMs: number;
  strategy: RateLimitStrategy;
}

/**
 * Rate limit strategies
 */
export type RateLimitStrategy = 'sliding_window' | 'fixed_window' | 'token_bucket';

/**
 * Webhook metadata
 */
export interface WebhookMetadata {
  created: number;
  lastUpdated: number;
  created_by: string;
  description?: string;
  tags: string[];
  version: string;
}

/**
 * Webhook event payload
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  source: string;
  version: string;
  data: WebhookEventData;
  signature: string;
  metadata: WebhookEventMetadata;
}

/**
 * Webhook event data
 */
export interface WebhookEventData {
  trustScore?: TrustScore;
  violation?: TrustViolationData;
  principleViolation?: PrincipleViolationData;
  emergence?: EmergenceData;
  agent?: AgentData;
  system?: SystemData;
  security?: SecurityData;
  performance?: PerformanceData;
  compliance?: ComplianceData;
}

/**
 * Trust violation data
 */
export interface TrustViolationData {
  score: number;
  threshold: number;
  severity: ViolationSeverity;
  principles: TrustPrincipleKey[];
  description?: string;
  context: ViolationContext;
}

/**
 * Principle violation data
 */
export interface PrincipleViolationData {
  principle: TrustPrincipleKey;
  score: number;
  threshold: number;
  severity: ViolationSeverity;
  description: string;
  context: ViolationContext;
}

/**
 * Emergence data
 */
export interface EmergenceData {
  bedauIndex: number;
  emergenceType: EmergenceType;
  algorithm: string;
  confidence: number;
  context: EmergenceContext;
}

/**
 * Emergence types
 */
export type EmergenceType = 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE' | 'STRONG_EMERGENCE';

/**
 * Agent data
 */
export interface AgentData {
  agentId: string;
  agentType: string;
  status: string;
  error?: string;
  lastActivity: number;
  taskCount?: number;
  context: AgentContext;
}

/**
 * System data
 */
export interface SystemData {
  service: string;
  error: string;
  stackTrace?: string;
  metrics?: Record<string, number>;
  context: SystemContext;
}

/**
 * Security data
 */
export interface SecurityData {
  incidentType: SecurityIncidentType;
  severity: SecuritySeverity;
  source: string;
  description: string;
  context: SecurityContext;
}

/**
 * Performance data
 */
export interface PerformanceData {
  metric: string;
  value: number;
  threshold: number;
  severity: PerformanceSeverity;
  context: PerformanceContext;
}

/**
 * Compliance data
 */
export interface ComplianceData {
  framework: string;
  requirement: string;
  status: ComplianceStatus;
  severity: ComplianceSeverity;
  context: ComplianceContext;
}

/**
 * Violation severity
 */
export type ViolationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Violation context
 */
export interface ViolationContext {
  interactionId?: string;
  agentId?: string;
  tenant?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Emergence context
 */
export interface EmergenceContext {
  algorithm: string;
  parameters?: Record<string, any>;
  dataset?: string;
  model?: string;
  additionalData?: Record<string, any>;
}

/**
 * Agent context
 */
export interface AgentContext {
  tenant?: string;
  task?: string;
  workflow?: string;
  additionalData?: Record<string, any>;
}

/**
 * System context
 */
export interface SystemContext {
  service: string;
  version: string;
  environment: string;
  instanceId: string;
  additionalData?: Record<string, any>;
}

/**
 * Security context
 */
export interface SecurityContext {
  source: string;
  target?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

/**
 * Performance context
 */
export interface PerformanceContext {
  service: string;
  operation?: string;
  duration?: number;
  additionalData?: Record<string, any>;
}

/**
 * Compliance context
 */
export interface ComplianceContext {
  framework: string;
  version: string;
  section?: string;
  additionalData?: Record<string, any>;
}

/**
 * Security incident types
 */
export type SecurityIncidentType = 
  | 'unauthorized_access'
  | 'data_breach'
  | 'injection_attack'
  | 'dos_attack'
  | 'authentication_failure'
  | 'authorization_failure'
  | 'suspicious_activity'
  | 'malware_detected';

/**
 * Security severity
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Performance severity
 */
export type PerformanceSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Compliance status
 */
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'unknown';

/**
 * Compliance severity
 */
export type ComplianceSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Webhook event metadata
 */
export interface WebhookEventMetadata {
  eventId: string;
  correlationId?: string;
  causationId?: string;
  source: string;
  version: string;
  timestamp: number;
  processingTime: number;
  retryCount: number;
  priority: EventPriority;
}

/**
 * Event priority
 */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  webhookId: string;
  eventId: string;
  status: DeliveryStatus;
  attempt: number;
  timestamp: number;
  duration: number;
  response?: WebhookResponse;
  error?: WebhookError;
  nextRetry?: number;
}

/**
 * Delivery status
 */
export type DeliveryStatus = 
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'failed'
  | 'retrying'
  | 'expired'
  | 'cancelled';

/**
 * Webhook response
 */
export interface WebhookResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  duration: number;
}

/**
 * Webhook error
 */
export interface WebhookError {
  type: ErrorType;
  message: string;
  code?: string;
  stack?: string;
  originalError?: any;
}

/**
 * Error types
 */
export type ErrorType = 
  | 'network_error'
  | 'timeout_error'
  | 'http_error'
  | 'validation_error'
  | 'rate_limit_error'
  | 'authentication_error'
  | 'parse_error'
  | 'unknown_error';

/**
 * Webhook manager configuration
 */
export interface WebhookManagerConfig {
  defaultTimeout: number;
  maxConcurrentDeliveries: number;
  defaultRetryPolicy: RetryPolicy;
  queueSize: number;
  batchSize: number;
  batchTimeout: number;
  metricsEnabled: boolean;
  deadLetterQueue: boolean;
}

/**
 * Webhook statistics
 */
export interface WebhookStatistics {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  eventsByType: Record<WebhookEventType, number>;
  errorsByType: Record<ErrorType, number>;
  lastUpdated: number;
}

/**
 * Webhook alert request
 */
export interface WebhookAlertRequest {
  type: WebhookEventType;
  data: WebhookEventData;
  priority?: EventPriority;
  metadata?: Partial<WebhookEventMetadata>;
  filters?: WebhookFilter[];
}

/**
 * Webhook registration request
 */
export interface WebhookRegistrationRequest {
  name: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy?: Partial<RetryPolicy>;
  filters?: WebhookFilter[];
  rateLimit?: RateLimit;
  metadata?: Partial<WebhookMetadata>;
}

/**
 * Webhook update request
 */
export interface WebhookUpdateRequest {
  name?: string;
  url?: string;
  events?: WebhookEventType[];
  secret?: string;
  enabled?: boolean;
  headers?: Record<string, string>;
  retryPolicy?: Partial<RetryPolicy>;
  filters?: WebhookFilter[];
  rateLimit?: RateLimit;
  metadata?: Partial<WebhookMetadata>;
}
