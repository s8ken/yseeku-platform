/**
 * OpenTelemetry Setup for SONATE Platform
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ObservabilityConfig } from './types';
/**
 * Initialize OpenTelemetry for the SONATE platform
 */
export declare function initializeObservability(config?: Partial<ObservabilityConfig>): NodeSDK;
/**
 * Shutdown OpenTelemetry gracefully
 */
export declare function shutdownObservability(): Promise<void>;
/**
 * Get the current SDK instance (for testing or advanced usage)
 */
export declare function getSDK(): NodeSDK | null;
/**
 * Check if OpenTelemetry is initialized
 */
export declare function isInitialized(): boolean;
