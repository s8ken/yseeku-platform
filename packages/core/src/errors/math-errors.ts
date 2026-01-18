import { PlatformError, ErrorCategory, ErrorSeverity, ErrorContext } from '../errors';

export class MathValidationError extends PlatformError {
  constructor(message: string, details?: any, context: ErrorContext = { timestamp: Date.now() }) {
    super(
      message,
      'MATH_VAL_001',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, metadata: { ...(context.metadata || {}), details } },
      false,
      'Invalid mathematical input'
    );
  }
}

export class CalculationError extends PlatformError {
  public readonly operation: string;
  public readonly inputs?: any;

  constructor(message: string, operation: string, inputs?: any, context: ErrorContext = { timestamp: Date.now() }) {
    super(
      message,
      'CALC_001',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.HIGH,
      { ...context, metadata: { ...(context.metadata || {}), operation, inputs } },
      false,
      'A calculation error occurred'
    );
    this.operation = operation;
    this.inputs = inputs;
  }
}

export class InvalidWeightsError extends MathValidationError {
  constructor(weights: Record<string, number>, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Invalid weights: ${JSON.stringify(weights)} - must be 0-1 and sum to 1.0`, { weights }, context);
  }
}
