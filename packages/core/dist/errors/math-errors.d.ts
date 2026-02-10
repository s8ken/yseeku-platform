import { PlatformError, ErrorContext } from '../utils/errors';
export declare class MathValidationError extends PlatformError {
    constructor(message: string, details?: any, context?: ErrorContext);
}
export declare class CalculationError extends PlatformError {
    readonly operation: string;
    readonly inputs?: any;
    constructor(message: string, operation: string, inputs?: any, context?: ErrorContext);
}
export declare class InvalidWeightsError extends MathValidationError {
    constructor(weights: Record<string, number>, context?: ErrorContext);
}
