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
export declare const BEDAU_INDEX_CONSTANTS: {
    /** Expected random baseline for emergence detection */
    readonly BASELINE_RANDOM_SCORE: 0.3;
    /** Assumed pooled standard deviation for effect size calculations */
    readonly POOLLED_STANDARD_DEVIATION: 0.25;
    /** Number of bootstrap samples for confidence intervals */
    readonly BOOTSTRAP_SAMPLES: 1000;
    /** Confidence level for statistical tests (0.95 = 95%) */
    readonly CONFIDENCE_LEVEL: 0.95;
    /** Emergence type thresholds */
    readonly EMERGENCE_THRESHOLDS: {
        /** Below this value: Linear behavior */
        readonly LINEAR: 0.3;
        /** Between LINEAR and WEAK_EMERGENCE: Weak emergence */
        readonly WEAK_EMERGENCE: 0.7;
        /** Above this value: High weak emergence */
        readonly HIGH_WEAK_EMERGENCE: 0.9;
    };
    /** Quantization levels for Lempel-Ziv complexity */
    readonly QUANTIZATION_LEVELS: 8;
};
/**
 * Resonance Scoring Constants
 * Used for SONATE resonance calculations and trust scoring
 */
export declare const RESONANCE_CONSTANTS: {
    /** Canonical weights for resonance dimensions */
    readonly WEIGHTS: {
        /** Semantic alignment weight */
        readonly ALIGNMENT: 0.3;
        /** Conversational continuity weight */
        readonly CONTINUITY: 0.3;
        /** Scaffold structure weight */
        readonly SCAFFOLD: 0.2;
        /** Ethical considerations weight */
        readonly ETHICS: 0.2;
    };
    /** Dynamic thresholds based on conversation stakes */
    readonly DYNAMIC_THRESHOLDS: {
        /** High stakes: strict requirements */
        readonly HIGH: {
            readonly ETHICS: 0.95;
            readonly ALIGNMENT: 0.85;
        };
        /** Medium stakes: moderate requirements */
        readonly MEDIUM: {
            readonly ETHICS: 0.75;
            readonly ALIGNMENT: 0.7;
        };
        /** Low stakes: relaxed requirements */
        readonly LOW: {
            readonly ETHICS: 0.5;
            readonly ALIGNMENT: 0.6;
        };
    };
    /** Adversarial detection thresholds */
    readonly ADVERSARIAL: {
        /** Penalty for detected adversarial input */
        readonly PENALTY_MULTIPLIER: 0.5;
        /** Threshold for flagging as adversarial */
        readonly DETECTION_THRESHOLD: 0.7;
    };
};
/**
 * Trust Protocol Constants
 * Used for SONATE constitutional trust scoring
 */
export declare const TRUST_PROTOCOL_CONSTANTS: {
    /** Trust score classification thresholds */
    readonly THRESHOLDS: {
        /** Excellent trust: 8.0+ */
        readonly HIGH: 8;
        /** Acceptable trust: 6.0+ */
        readonly MEDIUM: 6;
        /** Minimum acceptable: 4.0+ */
        readonly LOW: 4;
    };
    /** Principle weights (must sum to 1.0) */
    readonly PRINCIPLE_WEIGHTS: {
        readonly CONSENT_ARCHITECTURE: 0.25;
        readonly INSPECTION_MANDATE: 0.2;
        readonly CONTINUOUS_VALIDATION: 0.2;
        readonly ETHICAL_OVERRIDE: 0.15;
        readonly RIGHT_TO_DISCONNECT: 0.1;
        readonly MORAL_RECOGNITION: 0.1;
    };
    /** Critical principles that cause total trust failure when violated */
    readonly CRITICAL_PRINCIPLES: readonly ["CONSENT_ARCHITECTURE", "ETHICAL_OVERRIDE"];
    /** Minimum score for principle compliance */
    readonly PRINCIPLE_COMPLIANCE_MIN: 5;
};
/**
 * Performance Constants
 * Used for system performance targets and monitoring
 */
export declare const PERFORMANCE_CONSTANTS: {
    /** Detection latency targets in milliseconds */
    readonly LATENCY: {
        /** Target for production detection */
        readonly TARGET: 100;
        /** Maximum acceptable latency */
        readonly MAXIMUM: 200;
        /** Alert threshold for latency */
        readonly ALERT: 150;
    };
    /** Throughput targets (detections per second) */
    readonly THROUGHPUT: {
        /** Target for production */
        readonly TARGET: 1000;
        /** Minimum acceptable */
        readonly MINIMUM: 500;
        /** Maximum before scaling needed */
        readonly SCALE_THRESHOLD: 1500;
    };
    /** Memory usage targets in MB */
    readonly MEMORY: {
        /** Per detector instance */
        readonly DETECTOR_INSTANCE: 50;
        /** Alert threshold */
        readonly ALERT: 100;
        /** Maximum before cleanup */
        readonly MAXIMUM: 200;
    };
};
/**
 * Security Constants
 * Used for authentication and security configurations
 */
export declare const SECURITY_CONSTANTS: {
    /** JWT configuration */
    readonly JWT: {
        /** Access token expiration (1 hour) */
        readonly ACCESS_TOKEN_EXPIRATION: 3600;
        /** Refresh token expiration (7 days) */
        readonly REFRESH_TOKEN_EXPIRATION: 604800;
        /** Minimum secret length */
        readonly MIN_SECRET_LENGTH: 32;
    };
    /** Session management */
    readonly SESSION: {
        /** Session duration (1 hour) */
        readonly DURATION: 3600000;
        /** Cleanup interval (5 minutes) */
        readonly CLEANUP_INTERVAL: 300000;
        /** Maximum concurrent sessions per user */
        readonly MAX_CONCURRENT: 5;
    };
    /** Rate limiting */
    readonly RATE_LIMITING: {
        /** Window duration (1 minute) */
        readonly WINDOW_MS: 60000;
        /** Maximum requests per window */
        readonly MAX_REQUESTS: 100;
        /** Lockout duration after failed attempts */
        readonly LOCKOUT_DURATION: 900000;
        /** Maximum failed attempts before lockout */
        readonly MAX_FAILED_ATTEMPTS: 5;
    };
};
/**
 * Type definitions for constants
 */
export type EmergenceType = keyof typeof BEDAU_INDEX_CONSTANTS.EMERGENCE_THRESHOLDS;
export type StakesLevel = keyof typeof RESONANCE_CONSTANTS.DYNAMIC_THRESHOLDS;
export type TrustPrincipleKey = keyof typeof TRUST_PROTOCOL_CONSTANTS.PRINCIPLE_WEIGHTS;
/**
 * Validation functions for constants
 */
export declare const validateConstants: {
    /** Validate that principle weights sum to 1.0 */
    readonly validatePrincipleWeights: () => boolean;
    /** Validate resonance weights sum to 1.0 */
    readonly validateResonanceWeights: () => boolean;
};
