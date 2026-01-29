"use strict";
/**
 * @sonate/observability - Enterprise Observability & Monitoring
 *
 * OpenTelemetry-based observability for the SONATE platform
 * Provides metrics, tracing, and monitoring for enterprise deployments
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentSpan = exports.createDetectionSpan = exports.createTrustSpan = exports.PerformanceMetrics = exports.AgentMetrics = exports.DetectionMetrics = exports.TrustMetrics = exports.shutdownObservability = exports.initializeObservability = exports.ObservabilityManager = void 0;
// Core observability setup
var observability_manager_1 = require("./observability-manager");
Object.defineProperty(exports, "ObservabilityManager", { enumerable: true, get: function () { return observability_manager_1.ObservabilityManager; } });
var setup_1 = require("./setup");
Object.defineProperty(exports, "initializeObservability", { enumerable: true, get: function () { return setup_1.initializeObservability; } });
Object.defineProperty(exports, "shutdownObservability", { enumerable: true, get: function () { return setup_1.shutdownObservability; } });
// Metrics collection
var trust_metrics_1 = require("./metrics/trust-metrics");
Object.defineProperty(exports, "TrustMetrics", { enumerable: true, get: function () { return trust_metrics_1.TrustMetrics; } });
var detection_metrics_1 = require("./metrics/detection-metrics");
Object.defineProperty(exports, "DetectionMetrics", { enumerable: true, get: function () { return detection_metrics_1.DetectionMetrics; } });
var agent_metrics_1 = require("./metrics/agent-metrics");
Object.defineProperty(exports, "AgentMetrics", { enumerable: true, get: function () { return agent_metrics_1.AgentMetrics; } });
var performance_metrics_1 = require("./metrics/performance-metrics");
Object.defineProperty(exports, "PerformanceMetrics", { enumerable: true, get: function () { return performance_metrics_1.PerformanceMetrics; } });
// Tracing utilities
var span_helpers_1 = require("./tracing/span-helpers");
Object.defineProperty(exports, "createTrustSpan", { enumerable: true, get: function () { return span_helpers_1.createTrustSpan; } });
Object.defineProperty(exports, "createDetectionSpan", { enumerable: true, get: function () { return span_helpers_1.createDetectionSpan; } });
Object.defineProperty(exports, "createAgentSpan", { enumerable: true, get: function () { return span_helpers_1.createAgentSpan; } });
// Export types
__exportStar(require("./types"), exports);
// Configuration
__exportStar(require("./config"), exports);
