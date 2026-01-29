"use strict";
/**
 * Shared types for @sonate/lab package
 * Types for experiment orchestration and multi-agent systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrityError = exports.ExperimentError = exports.MessageBuilder = exports.MessageTypes = void 0;
// Message Types
exports.MessageTypes = {
    EXPERIMENT_START: 'EXPERIMENT_START',
    EXPERIMENT_END: 'EXPERIMENT_END',
    TRIAL_START: 'TRIAL_START',
    TRIAL_END: 'TRIAL_END',
    EVALUATION_REQUEST: 'EVALUATION_REQUEST',
    EVALUATION_RESPONSE: 'EVALUATION_RESPONSE',
    RESPONSE: 'RESPONSE',
    ERROR: 'ERROR',
};
// Message Builder
class MessageBuilder {
    constructor(from) {
        this.message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from,
        };
    }
    to(role) {
        this.message.to = role;
        return this;
    }
    type(type) {
        this.message.type = type;
        return this;
    }
    payload(data) {
        this.message.payload = data;
        return this;
    }
    experiment(id) {
        this.message.experimentId = id;
        return this;
    }
    run(id) {
        this.message.runId = id;
        return this;
    }
    trial(id) {
        this.message.trialId = id;
        return this;
    }
    build() {
        return this.message;
    }
}
exports.MessageBuilder = MessageBuilder;
// Experiment Error
class ExperimentError extends Error {
    constructor(message, code, experimentId, runId) {
        super(message);
        this.name = 'ExperimentError';
        this.code = code;
        this.experimentId = experimentId;
        this.runId = runId;
    }
}
exports.ExperimentError = ExperimentError;
// Integrity Error
class IntegrityError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'IntegrityError';
        this.details = details;
    }
}
exports.IntegrityError = IntegrityError;
// Note: InMemoryAgentBus is exported from agent-bus.ts
// Import it directly from './agent-bus' where needed
