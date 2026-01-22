/**
 * Algorithmic Constants for YSEEKU Platform
 * 
 * This file contains magic numbers extracted from the codebase
 * with proper documentation and type safety.
 */

/**
 * Bedau Index Constants
 * Used for weak emergence detection in AI systems
 * Based on Mark Bedau's work on weak emergence
 */
export const BEDAU_INDEX_CONSTANTS = {
  /** Expected random baseline for emergence detection */
  BASELINE_RANDOM_SCORE: 0.3,
  
  /** Assumed pooled standard deviation for effect size calculations */
  POOLLED_STANDARD_DEVIATION: 0.25,
  
  /** Number of bootstrap samples for confidence intervals */
  BOOTSTRAP_SAMPLES: 1000,
  
  /** Confidence level for statistical tests (0.95 = 95%) */
  CONFIDENCE_LEVEL: 0.95,
  
  /** Emergence type thresholds */
  EMERGENCE_THRESHOLDS: {
    /** Below this value: Linear behavior */
    LINEAR: 0.3,
    /** Between LINEAR and WEAK_EMERGENCE: Weak emergence */
    WEAK_EMERGENCE: 0.7,
    /** Above this value: High weak emergence */
    HIGH_WEAK_EMERGENCE: 0.9,
  },
  
  /** Quantization levels for Lempel-Ziv complexity */
  QUANTIZATION_LEVELS: 8,
} as const;

/**
 * Resonance Scoring Constants
 * Used for SONATE resonance calculations and trust scoring
 */
export const RESONANCE_CONSTANTS = {
  /** Canonical weights for resonance dimensions */
  WEIGHTS: {
    /** Semantic alignment weight */
    ALIGNMENT: 0.3,
    /** Conversational continuity weight */
    CONTINUITY: 0.3,
    /** Scaffold structure weight */
    SCAFFOLD: 0.2,
    /** Ethical considerations weight */
    ETHICS: 0.2,
  },
  
  /** Dynamic thresholds based on conversation stakes */
  DYNAMIC_THRESHOLDS: {
    /** High stakes: strict requirements */
    HIGH: {
      ETHICS: 0.95,
      ALIGNMENT: 0.85,
    },
    /** Medium stakes: moderate requirements */
    MEDIUM: {
      ETHICS: 0.75,
      ALIGNMENT: 0.7,
    },
    /** Low stakes: relaxed requirements */
    LOW: {
      ETHICS: 0.5,
      ALIGNMENT: 0.6,
    },
  },
  
  /** Adversarial detection thresholds */
  ADVERSARIAL: {
    /** Penalty for detected adversarial input */
    PENALTY_MULTIPLIER: 0.5,
    /** Threshold for flagging as adversarial */
    DETECTION_THRESHOLD: 0.7,
  },
} as const;

/**
 * Trust Protocol Constants
 * Used for SONATE constitutional trust scoring
 */
export const TRUST_PROTOCOL_CONSTANTS = {
  /** Trust score classification thresholds */
  THRESHOLDS: {
    /** Excellent trust: 8.0+ */
    HIGH: 8.0,
    /** Acceptable trust: 6.0+ */
    MEDIUM: 6.0,
    /** Minimum acceptable: 4.0+ */
    LOW: 4.0,
  },
  
  /** Principle weights (must sum to 1.0) */
  PRINCIPLE_WEIGHTS: {
    CONSENT_ARCHITECTURE: 0.25,
    INSPECTION_MANDATE: 0.2,
    CONTINUOUS_VALIDATION: 0.2,
    ETHICAL_OVERRIDE: 0.15,
    RIGHT_TO_DISCONNECT: 0.1,
    MORAL_RECOGNITION: 0.1,
  },
  
  /** Critical principles that cause total trust failure when violated */
  CRITICAL_PRINCIPLES: [
    'CONSENT_ARCHITECTURE',
    'ETHICAL_OVERRIDE',
  ] as const,
  
  /** Minimum score for principle compliance */
  PRINCIPLE_COMPLIANCE_MIN: 5.0,
} as const;

/**
 * Performance Constants
 * Used for system performance targets and monitoring
 */
export const PERFORMANCE_CONSTANTS = {
  /** Detection latency targets in milliseconds */
  LATENCY: {
    /** Target for production detection */
    TARGET: 100,
    /** Maximum acceptable latency */
    MAXIMUM: 200,
    /** Alert threshold for latency */
    ALERT: 150,
  },
  
  /** Throughput targets (detections per second) */
  THROUGHPUT: {
    /** Target for production */
    TARGET: 1000,
    /** Minimum acceptable */
    MINIMUM: 500,
    /** Maximum before scaling needed */
    SCALE_THRESHOLD: 1500,
  },
  
  /** Memory usage targets in MB */
  MEMORY: {
    /** Per detector instance */
    DETECTOR_INSTANCE: 50,
    /** Alert threshold */
    ALERT: 100,
    /** Maximum before cleanup */
    MAXIMUM: 200,
  },
} as const;

/**
 * Security Constants
 * Used for authentication and security configurations
 */
export const SECURITY_CONSTANTS = {
  /** JWT configuration */
  JWT: {
    /** Access token expiration (1 hour) */
    ACCESS_TOKEN_EXPIRATION: 3600,
    /** Refresh token expiration (7 days) */
    REFRESH_TOKEN_EXPIRATION: 604800,
    /** Minimum secret length */
    MIN_SECRET_LENGTH: 32,
  },
  
  /** Session management */
  SESSION: {
    /** Session duration (1 hour) */
    DURATION: 3600000,
    /** Cleanup interval (5 minutes) */
    CLEANUP_INTERVAL: 300000,
    /** Maximum concurrent sessions per user */
    MAX_CONCURRENT: 5,
  },
  
  /** Rate limiting */
  RATE_LIMITING: {
    /** Window duration (1 minute) */
    WINDOW_MS: 60000,
    /** Maximum requests per window */
    MAX_REQUESTS: 100,
    /** Lockout duration after failed attempts */
    LOCKOUT_DURATION: 900000, // 15 minutes
    /** Maximum failed attempts before lockout */
    MAX_FAILED_ATTEMPTS: 5,
  },
} as const;

/**
 * Type definitions for constants
 */
export type EmergenceType = keyof typeof BEDAU_INDEX_CONSTANTS.EMERGENCE_THRESHOLDS;
export type StakesLevel = keyof typeof RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS;
export type TrustPrincipleKey = keyof typeof TRUST_PROTOCOL_CONSTANTS.PRINCIPLE_WEIGHTS;

/**
 * Validation functions for constants
 */
export const validateConstants = {
  /** Validate that principle weights sum to 1.0 */
  validatePrincipleWeights(): boolean {
    const weights = TRUST_PROTOCOL_CONSTANTS.PRINCIPLE_WEIGHTS;
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    return Math.abs(sum - 1.0) < 0.001; // Allow small floating point errors
  },
  
  /** Validate resonance weights sum to 1.0 */
  validateResonanceWeights(): boolean {
    const weights = RESONANCE_CONSTANTS.WEIGHTS;
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    return Math.abs(sum - 1.0) < 0.001;
  },
} as const;
