/**
 * Observability Configuration
 */

import { ObservabilityConfig } from './types';

/**
 * Default configuration for SONATE observability
 */
export const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig = {
  serviceName: 'sonate-platform',
  serviceVersion: '1.4.0',
  environment: process.env.NODE_ENV || 'development',
  enableMetrics: process.env.ENABLE_OTEL_METRICS !== 'false',
  enableTracing: process.env.ENABLE_OTEL_TRACING !== 'false',
  exporters: {
    prometheus: process.env.OTEL_EXPORTER_PROMETHEUS_ENABLED === 'true' ? {
      endpoint: process.env.OTEL_EXPORTER_PROMETHEUS_ENDPOINT || '/metrics',
      port: parseInt(process.env.OTEL_EXPORTER_PROMETHEUS_PORT || '9464'),
    } : undefined,
    jaeger: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT ? {
      endpoint: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT,
    } : undefined,
    zipkin: process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ? {
      endpoint: process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT,
    } : undefined,
  },
  resourceDetectors: {
    aws: process.env.OTEL_RESOURCE_DETECTORS_AWS === 'true',
    gcp: process.env.OTEL_RESOURCE_DETECTORS_GCP === 'true',
  },
  sampling: {
    probability: parseFloat(process.env.OTEL_SAMPLING_PROBABILITY || '1.0'),
  },
};

/**
 * Environment variable mappings
 */
export const OBSERVABILITY_ENV_VARS = {
  // Service configuration
  SERVICE_NAME: 'OTEL_SERVICE_NAME',
  SERVICE_VERSION: 'OTEL_SERVICE_VERSION',
  ENVIRONMENT: 'NODE_ENV',
  
  // Feature flags
  ENABLE_METRICS: 'ENABLE_OTEL_METRICS',
  ENABLE_TRACING: 'ENABLE_OTEL_TRACING',
  
  // Prometheus exporter
  PROMETHEUS_ENABLED: 'OTEL_EXPORTER_PROMETHEUS_ENABLED',
  PROMETHEUS_ENDPOINT: 'OTEL_EXPORTER_PROMETHEUS_ENDPOINT',
  PROMETHEUS_PORT: 'OTEL_EXPORTER_PROMETHEUS_PORT',
  
  // Jaeger exporter
  JAEGER_ENDPOINT: 'OTEL_EXPORTER_JAEGER_ENDPOINT',
  
  // Zipkin exporter
  ZIPKIN_ENDPOINT: 'OTEL_EXPORTER_ZIPKIN_ENDPOINT',
  
  // Resource detectors
  AWS_DETECTOR: 'OTEL_RESOURCE_DETECTORS_AWS',
  GCP_DETECTOR: 'OTEL_RESOURCE_DETECTORS_GCP',
  
  // Sampling
  SAMPLING_PROBABILITY: 'OTEL_SAMPLING_PROBABILITY',
} as const;

/**
 * Validate observability configuration
 */
export function validateConfig(config: Partial<ObservabilityConfig>): ObservabilityConfig {
  const merged = { ...DEFAULT_OBSERVABILITY_CONFIG, ...config };
  
  // Validate sampling probability
  if (merged.sampling && (merged.sampling.probability < 0 || merged.sampling.probability > 1)) {
    throw new Error('Sampling probability must be between 0 and 1');
  }
  
  // Validate Prometheus port
  if (merged.exporters.prometheus && 
      (merged.exporters.prometheus.port < 1 || merged.exporters.prometheus.port > 65535)) {
    throw new Error('Prometheus port must be between 1 and 65535');
  }
  
  return merged;
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): ObservabilityConfig {
  return validateConfig({
    serviceName: process.env.OTEL_SERVICE_NAME,
    serviceVersion: process.env.OTEL_SERVICE_VERSION,
    environment: process.env.NODE_ENV,
    enableMetrics: process.env.ENABLE_OTEL_METRICS !== 'false',
    enableTracing: process.env.ENABLE_OTEL_TRACING !== 'false',
    exporters: {
      prometheus: process.env.OTEL_EXPORTER_PROMETHEUS_ENABLED === 'true' ? {
        endpoint: process.env.OTEL_EXPORTER_PROMETHEUS_ENDPOINT || '/metrics',
        port: parseInt(process.env.OTEL_EXPORTER_PROMETHEUS_PORT || '9464'),
      } : undefined,
      jaeger: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT ? {
        endpoint: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT,
      } : undefined,
      zipkin: process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ? {
        endpoint: process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT,
      } : undefined,
    },
    resourceDetectors: {
      aws: process.env.OTEL_RESOURCE_DETECTORS_AWS === 'true',
      gcp: process.env.OTEL_RESOURCE_DETECTORS_GCP === 'true',
    },
    sampling: process.env.OTEL_SAMPLING_PROBABILITY ? {
      probability: parseFloat(process.env.OTEL_SAMPLING_PROBABILITY),
    } : undefined,
  });
}
