/**
 * Adversarial Emergence Testing Module
 *
 * Refactored modular implementation for adversarial testing
 */

// Export all types and interfaces
export * from './types';

// Export core classes
export { AdversarialTestFactory } from './test-factory';
export { AdversarialTestExecutor } from './test-executor';
export {
  AdversarialEmergenceTestingEngine,
  createAdversarialEmergenceTestingEngine,
} from './engine';

// Legacy compatibility - re-export main engine class
export { AdversarialEmergenceTestingEngine as AdversarialEmergenceTestingSuite } from './engine';
