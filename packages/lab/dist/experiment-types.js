"use strict";
/**
 * SONATE Resonate Experiment System Types
 * Core types for multi-agent, double-blind experimentation framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrityError = exports.RateLimitError = exports.ExperimentError = void 0;
// Error Types
class ExperimentError extends Error {
    constructor(message, code, experimentId, runId, trialId) {
        super(message);
        this.code = code;
        this.experimentId = experimentId;
        this.runId = runId;
        this.trialId = trialId;
        this.name = 'ExperimentError';
    }
}
exports.ExperimentError = ExperimentError;
class RateLimitError extends ExperimentError {
    constructor(message, provider, resetAt) {
        super(message, 'RATE_LIMIT_EXCEEDED');
        this.provider = provider;
        this.resetAt = resetAt;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class IntegrityError extends ExperimentError {
    constructor(message, expectedHash, actualHash) {
        super(message, 'INTEGRITY_MISMATCH');
        this.expectedHash = expectedHash;
        this.actualHash = actualHash;
        this.name = 'IntegrityError';
    }
}
exports.IntegrityError = IntegrityError;
