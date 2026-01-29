/**
 * Span Helper Functions for SONATE Platform
 */
import { Span } from '@opentelemetry/api';
import { SonateSpanAttributes } from '../types';
/**
 * Create a trust evaluation span
 */
export declare function createTrustSpan(operation: string, attributes?: SonateSpanAttributes): Span;
/**
 * Create a detection processing span
 */
export declare function createDetectionSpan(operation: string, attributes?: SonateSpanAttributes): Span;
/**
 * Create an agent orchestration span
 */
export declare function createAgentSpan(operation: string, attributes?: SonateSpanAttributes): Span;
/**
 * Create an API request span
 */
export declare function createApiSpan(method: string, url: string, attributes?: SonateSpanAttributes): Span;
/**
 * Wrap a function with automatic tracing
 */
export declare function withTracing<T extends (...args: any[]) => any>(name: string, fn: T, attributes?: SonateSpanAttributes): T;
/**
 * Add error information to a span
 */
export declare function recordSpanError(span: Span, error: Error, attributes?: SonateSpanAttributes): void;
/**
 * Set span success status
 */
export declare function setSpanSuccess(span: Span, attributes?: SonateSpanAttributes): void;
