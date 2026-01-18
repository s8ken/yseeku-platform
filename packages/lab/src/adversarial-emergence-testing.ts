/**
 * Adversarial Emergence Testing Suite (Refactored)
 *
 * LEGACY FILE - This file has been refactored into modular components.
 *
 * The original 1068-line file has been broken down into:
 * - ./adversarial/types.ts - Type definitions
 * - ./adversarial/test-factory.ts - Test creation logic
 * - ./adversarial/test-executor.ts - Test execution logic
 * - ./adversarial/engine.ts - Main orchestrator
 * - ./adversarial/index.ts - Module exports
 *
 * Use the new modular structure for all new development.
 * This file remains for backward compatibility.
 */

// Re-export everything from the new modular structure
export * from './adversarial';

// Legacy compatibility alias
export { AdversarialEmergenceTestingEngine as AdversarialEmergenceTestingSuite } from './adversarial';
