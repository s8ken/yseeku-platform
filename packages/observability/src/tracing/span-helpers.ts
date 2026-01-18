/**
 * Span Helper Functions for SONATE Platform
 */

import { trace, Span, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { SonateSpanAttributes } from '../types';

/**
 * Create a trust evaluation span
 */
export function createTrustSpan(operation: string, attributes?: SonateSpanAttributes): Span {
  const tracer = trace.getTracer('sonate-trust');
  const span = tracer.startSpan(`sonate.trust.${operation}`, {
    kind: SpanKind.INTERNAL,
  });

  if (attributes) {
    span.setAttributes(attributes);
  }

  return span;
}

/**
 * Create a detection processing span
 */
export function createDetectionSpan(operation: string, attributes?: SonateSpanAttributes): Span {
  const tracer = trace.getTracer('sonate-detect');
  const span = tracer.startSpan(`sonate.detection.${operation}`, {
    kind: SpanKind.INTERNAL,
  });

  if (attributes) {
    span.setAttributes(attributes);
  }

  return span;
}

/**
 * Create an agent orchestration span
 */
export function createAgentSpan(operation: string, attributes?: SonateSpanAttributes): Span {
  const tracer = trace.getTracer('sonate-agent');
  const span = tracer.startSpan(`sonate.agent.${operation}`, {
    kind: SpanKind.INTERNAL,
  });

  if (attributes) {
    span.setAttributes(attributes);
  }

  return span;
}

/**
 * Create an API request span
 */
export function createApiSpan(method: string, url: string, attributes?: SonateSpanAttributes): Span {
  const tracer = trace.getTracer('sonate-api');
  const span = tracer.startSpan(`sonate.api.${method.toLowerCase()}`, {
    kind: SpanKind.SERVER,
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
export function withTracing<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  attributes?: SonateSpanAttributes
): T {
  return ((...args: any[]) => {
    const span = trace.getTracer('sonate-platform').startSpan(name);
    
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return value;
          })
          .catch((error) => {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.end();
            throw error;
          });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      }
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      throw error;
    }
  }) as T;
}

/**
 * Add error information to a span
 */
export function recordSpanError(span: Span, error: Error, attributes?: SonateSpanAttributes): void {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  
  span.setAttributes({
    'sonate.error.type': error.constructor.name,
    'sonate.error.message': error.message,
    ...attributes,
  });
}

/**
 * Set span success status
 */
export function setSpanSuccess(span: Span, attributes?: SonateSpanAttributes): void {
  span.setStatus({ code: SpanStatusCode.OK });
  
  if (attributes) {
    span.setAttributes(attributes);
  }
}
