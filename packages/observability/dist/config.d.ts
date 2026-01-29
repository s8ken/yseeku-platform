/**
 * Observability Configuration
 */
import { ObservabilityConfig } from './types';
/**
 * Default configuration for SONATE observability
 */
export declare const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig;
/**
 * Environment variable mappings
 */
export declare const OBSERVABILITY_ENV_VARS: {
    readonly SERVICE_NAME: "OTEL_SERVICE_NAME";
    readonly SERVICE_VERSION: "OTEL_SERVICE_VERSION";
    readonly ENVIRONMENT: "NODE_ENV";
    readonly ENABLE_METRICS: "ENABLE_OTEL_METRICS";
    readonly ENABLE_TRACING: "ENABLE_OTEL_TRACING";
    readonly PROMETHEUS_ENABLED: "OTEL_EXPORTER_PROMETHEUS_ENABLED";
    readonly PROMETHEUS_ENDPOINT: "OTEL_EXPORTER_PROMETHEUS_ENDPOINT";
    readonly PROMETHEUS_PORT: "OTEL_EXPORTER_PROMETHEUS_PORT";
    readonly JAEGER_ENDPOINT: "OTEL_EXPORTER_JAEGER_ENDPOINT";
    readonly ZIPKIN_ENDPOINT: "OTEL_EXPORTER_ZIPKIN_ENDPOINT";
    readonly AWS_DETECTOR: "OTEL_RESOURCE_DETECTORS_AWS";
    readonly GCP_DETECTOR: "OTEL_RESOURCE_DETECTORS_GCP";
    readonly SAMPLING_PROBABILITY: "OTEL_SAMPLING_PROBABILITY";
};
/**
 * Validate observability configuration
 */
export declare function validateConfig(config: Partial<ObservabilityConfig>): ObservabilityConfig;
/**
 * Load configuration from environment variables
 */
export declare function loadConfigFromEnv(): ObservabilityConfig;
