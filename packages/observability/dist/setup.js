"use strict";
/**
 * OpenTelemetry Setup for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeObservability = initializeObservability;
exports.shutdownObservability = shutdownObservability;
exports.getSDK = getSDK;
exports.isInitialized = isInitialized;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const exporter_zipkin_1 = require("@opentelemetry/exporter-zipkin");
const resourcesAny = require('@opentelemetry/resources');
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const resource_detector_aws_1 = require("@opentelemetry/resource-detector-aws");
const resource_detector_gcp_1 = require("@opentelemetry/resource-detector-gcp");
const config_1 = require("./config");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
let sdk = null;
/**
 * Initialize OpenTelemetry for the SONATE platform
 */
function initializeObservability(config) {
    if (sdk) {
        console.warn('OpenTelemetry already initialized');
        return sdk;
    }
    const finalConfig = config ? { ...(0, config_1.loadConfigFromEnv)(), ...config } : (0, config_1.loadConfigFromEnv)();
    // Build resource detectors
    const resourceDetectors = [];
    if (finalConfig.resourceDetectors.aws) {
        resourceDetectors.push(resource_detector_aws_1.awsEc2Detector, resource_detector_aws_1.awsEksDetector);
    }
    if (finalConfig.resourceDetectors.gcp) {
        resourceDetectors.push(resource_detector_gcp_1.gcpDetector);
    }
    // Build exporters
    const exporters = [];
    if (finalConfig.exporters.prometheus) {
        const prometheusExporter = new exporter_prometheus_1.PrometheusExporter({
            port: finalConfig.exporters.prometheus.port,
            endpoint: finalConfig.exporters.prometheus.endpoint,
        });
        exporters.push(prometheusExporter);
        console.log(`Prometheus metrics enabled on port ${finalConfig.exporters.prometheus.port}`);
    }
    if (finalConfig.exporters.jaeger) {
        const jaegerExporter = new exporter_jaeger_1.JaegerExporter({
            endpoint: finalConfig.exporters.jaeger.endpoint,
        });
        exporters.push(jaegerExporter);
        console.log(`Jaeger tracing enabled: ${finalConfig.exporters.jaeger.endpoint}`);
    }
    if (finalConfig.exporters.zipkin) {
        const zipkinExporter = new exporter_zipkin_1.ZipkinExporter({
            url: finalConfig.exporters.zipkin.endpoint,
        });
        exporters.push(zipkinExporter);
        console.log(`Zipkin tracing enabled: ${finalConfig.exporters.zipkin.endpoint}`);
    }
    // Create SDK
    sdk = new sdk_node_1.NodeSDK({
        resource: new resourcesAny.Resource({
            [semantic_conventions_1.SEMRESATTRS_SERVICE_NAME]: finalConfig.serviceName,
            [semantic_conventions_1.SEMRESATTRS_SERVICE_VERSION]: finalConfig.serviceVersion,
            [semantic_conventions_1.SEMRESATTRS_SERVICE_INSTANCE_ID]: generateInstanceId(),
        }),
        instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
        traceExporter: finalConfig.enableTracing ? exporters.find(e => e instanceof exporter_jaeger_1.JaegerExporter || e instanceof exporter_zipkin_1.ZipkinExporter) : undefined,
        metricReader: finalConfig.enableMetrics && finalConfig.exporters.prometheus ? new exporter_prometheus_1.PrometheusExporter({
            port: finalConfig.exporters.prometheus.port,
            endpoint: finalConfig.exporters.prometheus.endpoint,
        }) : undefined,
        sampler: finalConfig.sampling ? new sdk_trace_base_1.TraceIdRatioBasedSampler(finalConfig.sampling.probability) : undefined,
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
async function shutdownObservability() {
    if (sdk) {
        await sdk.shutdown();
        sdk = null;
        console.log('OpenTelemetry shutdown complete');
    }
}
/**
 * Generate a unique instance ID for this service
 */
function generateInstanceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}
/**
 * Get the current SDK instance (for testing or advanced usage)
 */
function getSDK() {
    return sdk;
}
/**
 * Check if OpenTelemetry is initialized
 */
function isInitialized() {
    return sdk !== null;
}
