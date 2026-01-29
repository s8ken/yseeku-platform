"use strict";
/**
 * Observability Types for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SONATE_SPANS = exports.SONATE_METRICS = void 0;
/**
 * Metric names for SONATE operations
 */
exports.SONATE_METRICS = {
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
};
/**
 * Span names for SONATE operations
 */
exports.SONATE_SPANS = {
    TRUST_EVALUATION: 'sonate.trust.evaluation',
    TRUST_RECEIPT_CREATION: 'sonate.trust.receipt_creation',
    DETECTION_PROCESSING: 'sonate.detection.processing',
    EMERGENCE_ANALYSIS: 'sonate.emergence.analysis',
    AGENT_TASK_EXECUTION: 'sonate.agent.task_execution',
    AGENT_ORCHESTRATION: 'sonate.agent.orchestration',
    API_REQUEST: 'sonate.api.request',
    DATABASE_QUERY: 'sonate.database.query',
};
