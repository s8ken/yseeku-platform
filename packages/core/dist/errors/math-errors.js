"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidWeightsError = exports.CalculationError = exports.MathValidationError = void 0;
const errors_1 = require("../utils/errors");
class MathValidationError extends errors_1.PlatformError {
    constructor(message, details, context = { timestamp: Date.now() }) {
        super(message, 'MATH_VAL_001', errors_1.ErrorCategory.VALIDATION, errors_1.ErrorSeverity.LOW, { ...context, metadata: { ...(context.metadata || {}), details } }, false, 'Invalid mathematical input');
    }
}
exports.MathValidationError = MathValidationError;
class CalculationError extends errors_1.PlatformError {
    constructor(message, operation, inputs, context = { timestamp: Date.now() }) {
        super(message, 'CALC_001', errors_1.ErrorCategory.BUSINESS_LOGIC, errors_1.ErrorSeverity.HIGH, { ...context, metadata: { ...(context.metadata || {}), operation, inputs } }, false, 'A calculation error occurred');
        this.operation = operation;
        this.inputs = inputs;
    }
}
exports.CalculationError = CalculationError;
class InvalidWeightsError extends MathValidationError {
    constructor(weights, context = { timestamp: Date.now() }) {
        super(`Invalid weights: ${JSON.stringify(weights)} - must be 0-1 and sum to 1.0`, { weights }, context);
    }
}
exports.InvalidWeightsError = InvalidWeightsError;
