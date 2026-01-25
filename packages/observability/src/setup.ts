/**
 * OpenTelemetry Setup for SONATE Platform
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_SERVICE_INSTANCE_ID } from '@opentelemetry/semantic-conventions';
import { awsEc2Detector, awsEksDetector } from '@opentelemetry/resource-detector-aws';
import { gcpDetector } from '@opentelemetry/resource-detector-gcp';

import { ObservabilityConfig } from './types';
import { DEFAULT_OBSERVABILITY_CONFIG, loadConfigFromEnv } from './config';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry for the SONATE platform
 */
export function initializeObservability(config?: Partial<ObservabilityConfig>): NodeSDK {
  if (sdk) {
    console.warn('OpenTelemetry already initialized');
    return sdk;
  }

  const finalConfig = config ? { ...loadConfigFromEnv(), ...config } : loadConfigFromEnv();
  
  // Build resource detectors
  const resourceDetectors = [];
  if (finalConfig.resourceDetectors.aws) {
    resourceDetectors.push(awsEc2Detector, awsEksDetector);
  }
  if (finalConfig.resourceDetectors.gcp) {
    resourceDetectors.push(gcpDetector);
  }

  // Build exporters
  const exporters = [];
  
  if (finalConfig.exporters.prometheus) {
    const prometheusExporter = new PrometheusExporter({
      port: finalConfig.exporters.prometheus.port,
      endpoint: finalConfig.exporters.prometheus.endpoint,
    });
    exporters.push(prometheusExporter);
    console.log(`Prometheus metrics enabled on port ${finalConfig.exporters.prometheus.port}`);
  }
  
  if (finalConfig.exporters.jaeger) {
    const jaegerExporter = new JaegerExporter({
      endpoint: finalConfig.exporters.jaeger.endpoint,
    });
    exporters.push(jaegerExporter);
    console.log(`Jaeger tracing enabled: ${finalConfig.exporters.jaeger.endpoint}`);
  }
  
  if (finalConfig.exporters.zipkin) {
    const zipkinExporter = new ZipkinExporter({
      url: finalConfig.exporters.zipkin.endpoint,
    });
    exporters.push(zipkinExporter);
    console.log(`Zipkin tracing enabled: ${finalConfig.exporters.zipkin.endpoint}`);
  }

  // Create SDK
  sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: finalConfig.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: finalConfig.serviceVersion,
      [SEMRESATTRS_SERVICE_INSTANCE_ID]: generateInstanceId(),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: finalConfig.enableTracing ? exporters.find(e => e instanceof JaegerExporter || e instanceof ZipkinExporter) : undefined,
    metricReader: finalConfig.enableMetrics && finalConfig.exporters.prometheus ? 
      new PrometheusExporter({
        port: finalConfig.exporters.prometheus.port,
        endpoint: finalConfig.exporters.prometheus.endpoint,
      }) : undefined,
    sampler: finalConfig.sampling ? new TraceIdRatioBasedSampler(finalConfig.sampling.probability) : undefined,
  });

  // Initialize SDK
  sdk.start();
  
  console.log(`OpenTelemetry initialized for ${finalConfig.serviceName} v${finalConfig.serviceVersion}`);
  console.log(`Environment: ${finalConfig.environment}`);
  console.log(`Metrics: ${finalConfig.enableMetrics ? 'enabled' : 'disabled'}`);
  console.log(`Tracing: ${finalConfig.enableTracing ? 'enabled' : 'disabled'}`);
  
  return sdk;
}

/**
 * Shutdown OpenTelemetry gracefully
 */
export async function shutdownObservability(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    console.log('OpenTelemetry shutdown complete');
  }
}

/**
 * Generate a unique instance ID for this service
 */
function generateInstanceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Get the current SDK instance (for testing or advanced usage)
 */
export function getSDK(): NodeSDK | null {
  return sdk;
}

/**
 * Check if OpenTelemetry is initialized
 */
export function isInitialized(): boolean {
  return sdk !== null;
}
