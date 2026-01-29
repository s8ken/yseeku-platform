"use strict";
/**
 * Span Helper Functions for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrustSpan = createTrustSpan;
exports.createDetectionSpan = createDetectionSpan;
exports.createAgentSpan = createAgentSpan;
exports.createApiSpan = createApiSpan;
exports.withTracing = withTracing;
exports.recordSpanError = recordSpanError;
exports.setSpanSuccess = setSpanSuccess;
const api_1 = require("@opentelemetry/api");
/**
 * Create a trust evaluation span
 */
function createTrustSpan(operation, attributes) {
    const tracer = api_1.trace.getTracer('sonate-trust');
    const span = tracer.startSpan(`sonate.trust.${operation}`, {
        kind: api_1.SpanKind.INTERNAL,
    });
    if (attributes) {
        span.setAttributes(attributes);
    }
    return span;
}
/**
 * Create a detection processing span
 */
function createDetectionSpan(operation, attributes) {
    const tracer = api_1.trace.getTracer('sonate-detect');
    const span = tracer.startSpan(`sonate.detection.${operation}`, {
        kind: api_1.SpanKind.INTERNAL,
    });
    if (attributes) {
        span.setAttributes(attributes);
    }
    return span;
}
/**
 * Create an agent orchestration span
 */
function createAgentSpan(operation, attributes) {
    const tracer = api_1.trace.getTracer('sonate-agent');
    const span = tracer.startSpan(`sonate.agent.${operation}`, {
        kind: api_1.SpanKind.INTERNAL,
    });
    if (attributes) {
        span.setAttributes(attributes);
    }
    return span;
}
/**
 * Create an API request span
 */
function createApiSpan(method, url, attributes) {
    const tracer = api_1.trace.getTracer('sonate-api');
    const span = tracer.startSpan(`sonate.api.${method.toLowerCase()}`, {
        kind: api_1.SpanKind.SERVER,
    });
    // Standard API attributes
    span.setAttributes({
        'http.method': method,
        'http.url': url,
        ...attributes,
    });
    return span;
}
/**
 * Wrap a function with automatic tracing
 */
function withTracing(name, fn, attributes) {
    return ((...args) => {
        const span = api_1.trace.getTracer('sonate-platform').startSpan(name);
        try {
            if (attributes) {
                span.setAttributes(attributes);
            }
            const result = fn(...args);
            if (result instanceof Promise) {
                return result
                    .then((value) => {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    span.end();
                    return value;
                })
                    .catch((error) => {
                    span.recordException(error);
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                    span.end();
                    throw error;
                });
            }
            else {
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.end();
                return result;
            }
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.end();
            throw error;
        }
    });
}
/**
 * Add error information to a span
 */
function recordSpanError(span, error, attributes) {
    span.recordException(error);
    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
    span.setAttributes({
        'sonate.error.type': error.constructor.name,
        'sonate.error.message': error.message,
        ...attributes,
    });
}
/**
 * Set span success status
 */
function setSpanSuccess(span, attributes) {
    span.setStatus({ code: api_1.SpanStatusCode.OK });
    if (attributes) {
        span.setAttributes(attributes);
    }
}
