/**
 * Observability Types for SONATE Platform
 */

import { Attributes, SpanKind, SpanStatusCode } from '@opentelemetry/api';

/**
 * Trust-related observability data
 */
export interface TrustObservabilityData {
  trustScore: number;
  principleScores: Record<string, number>;
  violations: string[];
  timestamp: number;
  tenant?: string;
  agentId?: string;
  interactionId?: string;
}

/**
 * Detection performance data
 */
export interface DetectionObservabilityData {
  latency: number; // milliseconds
  throughput: number; // detections per second
  bedauIndex?: number;
  emergenceType?: string;
  algorithm: string;
  tenant?: string;
}

/**
 * Agent orchestration data
 */
export interface AgentObservabilityData {
  agentId: string;
  agentType: string;
  status: string;
  taskCount: number;
  lastActivity: number;
  errors: number;
  tenant?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceObservabilityData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  responseTime: number;
  errorRate: number;
  service: string;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  enableMetrics: boolean;
  enableTracing: boolean;
  exporters: {
    prometheus?: {
      endpoint: string;
      port: number;
    };
    jaeger?: {
      endpoint: string;
    };
    zipkin?: {
      endpoint: string;
    };
  };
  resourceDetectors: {
    aws?: boolean;
    gcp?: boolean;
  };
  sampling?: {
    probability: number;
  };
}

/**
 * Span attributes for SONATE operations
 */
export interface SonateSpanAttributes extends Attributes {
  'sonate.tenant'?: string;
  'sonate.agent.id'?: string;
  'sonate.agent.type'?: string;
  'sonate.trust.score'?: number;
  'sonate.trust.violations'?: string;
  'sonate.detection.latency'?: number;
  'sonate.detection.algorithm'?: string;
  'sonate.emergence.type'?: string;
  'sonate.interaction.id'?: string;
  'sonate.task.id'?: string;
  'sonate.error.type'?: string;
  'sonate.error.count'?: number;
}

/**
 * Metric names for SONATE operations
 */
export const SONATE_METRICS = {
  // Trust metrics
  TRUST_SCORE: 'sonate_trust_score',
  TRUST_VIOLATIONS: 'sonate_trust_violations_total',
  TRUST_EVALUATION_DURATION: 'sonate_trust_evaluation_duration_ms',
  
  // Detection metrics
  DETECTION_LATENCY: 'sonate_detection_latency_ms',
  DETECTION_THROUGHPUT: 'sonate_detection_throughput_per_second',
  BEDAU_INDEX: 'sonate_bedau_index',
  EMERGENCE_DETECTED: 'sonate_emergence_detected_total',
  
  // Agent metrics
  AGENT_TASKS_TOTAL: 'sonate_agent_tasks_total',
  AGENT_ERRORS_TOTAL: 'sonate_agent_errors_total',
  AGENT_UPTIME: 'sonate_agent_uptime_seconds',
  AGENT_LAST_ACTIVITY: 'sonate_agent_last_activity_timestamp',
  
  // Performance metrics
  CPU_USAGE: 'sonate_cpu_usage_percent',
  MEMORY_USAGE: 'sonate_memory_usage_bytes',
  DISK_USAGE: 'sonate_disk_usage_bytes',
  RESPONSE_TIME: 'sonate_response_time_ms',
  ERROR_RATE: 'sonate_error_rate_percent',
} as const;

/**
 * Span names for SONATE operations
 */
export const SONATE_SPANS = {
  TRUST_EVALUATION: 'sonate.trust.evaluation',
  TRUST_RECEIPT_CREATION: 'sonate.trust.receipt_creation',
  DETECTION_PROCESSING: 'sonate.detection.processing',
  EMERGENCE_ANALYSIS: 'sonate.emergence.analysis',
  AGENT_TASK_EXECUTION: 'sonate.agent.task_execution',
  AGENT_ORCHESTRATION: 'sonate.agent.orchestration',
  API_REQUEST: 'sonate.api.request',
  DATABASE_QUERY: 'sonate.database.query',
} as const;

/**
 * Span kinds for SONATE operations
 */
export type SonateSpanKind = SpanKind;

/**
 * Span status codes
 */
export type SonateSpanStatus = SpanStatusCode;
