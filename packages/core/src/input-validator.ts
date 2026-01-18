/**
 * Comprehensive Input Validation Framework
 * 
 * Provides enterprise-grade input validation for all public APIs
 * Includes type checking, range validation, format validation, and sanitization
 */

import {
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,
  FormatValidationError,
  RangeValidationError
} from './errors';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | Promise<boolean>;
  errorMessage?: string;
  sanitize?: boolean;
  allowedValues?: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized?: Record<string, any>;
}

/**
 * Input Validator for comprehensive validation
 */
export class InputValidator {
  private rules: Map<string, ValidationRule[]> = new Map();
  private sanitizers: Map<string, (value: any) => any> = new Map();

  /**
   * Register validation rules for a schema
   */
  registerRules(schemaName: string, rules: ValidationRule[]): void {
    this.rules.set(schemaName, rules);
  }

  /**
   * Register a custom sanitizer
   */
  registerSanitizer(field: string, sanitizer: (value: any) => any): void {
    this.sanitizers.set(field, sanitizer);
  }

  /**
   * Validate data against a schema
   */
  async validate(schemaName: string, data: Record<string, any>): Promise<ValidationResult> {
    const rules = this.rules.get(schemaName);
    if (!rules) {
      throw new Error(`Validation schema not found: ${schemaName}`);
    }

    const errors: ValidationError[] = [];
    const sanitized: Record<string, any> = { ...data };

    for (const rule of rules) {
      const value = data[rule.field];
      
      try {
        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(new MissingRequiredFieldError(rule.field));
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!rule.required && (value === undefined || value === null)) {
          continue;
        }

        // Type validation
        if (rule.type && !this.validateType(value, rule.type)) {
          errors.push(new InvalidInputError(rule.field, value));
          continue;
        }

        // String length validation
        if (rule.type === 'string' && typeof value === 'string') {
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push(new RangeValidationError(rule.field, value.length, rule.minLength, Infinity));
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push(new RangeValidationError(rule.field, value.length, 0, rule.maxLength));
          }
        }

        // Number range validation
        if (rule.type === 'number' && typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(new RangeValidationError(rule.field, value, rule.min, Infinity));
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(new RangeValidationError(rule.field, value, -Infinity, rule.max));
          }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string') {
          if (!rule.pattern.test(value)) {
            errors.push(new FormatValidationError(rule.field, rule.pattern.toString()));
          }
        }

        // Allowed values validation
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          errors.push(new InvalidInputError(
            rule.field,
            value,
            { timestamp: Date.now(), metadata: { allowedValues: rule.allowedValues } }
          ));
        }

        // Custom validation
        if (rule.custom) {
          const isValid = await rule.custom(value);
          if (!isValid) {
            errors.push(new ValidationError(
              rule.errorMessage || `Validation failed for field: ${rule.field}`
            ));
          }
        }

        // Sanitization
        if (rule.sanitize) {
          const sanitizer = this.sanitizers.get(rule.field);
          if (sanitizer) {
            sanitized[rule.field] = sanitizer(value);
          }
        }

      } catch (error) {
        errors.push(new ValidationError(
          `Validation error for field ${rule.field}: ${(error as Error).message}`,
          { timestamp: Date.now(), metadata: { field: rule.field, originalError: (error as Error).message } }
        ));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }

  /**
   * Validate type
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  /**
   * Validate a single field
   */
  async validateField(field: string, value: any, rule: ValidationRule): Promise<boolean> {
    const result = await this.validate('_temp', { [field]: value });
    return result.valid;
  }
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  // Trust Protocol Rules
  trustScore: {
    field: 'trustScore',
    type: 'number' as const,
    min: 0,
    max: 10,
    required: true
  },

  principleScore: {
    field: 'principleScore',
    type: 'number' as const,
    min: 0,
    max: 10,
    required: true
  },

  // Session Rules
  sessionId: {
    field: 'sessionId',
    type: 'string' as const,
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: true
  },

  userId: {
    field: 'userId',
    type: 'string' as const,
    minLength: 1,
    maxLength: 255,
    required: true
  },

  tenantId: {
    field: 'tenantId',
    type: 'string' as const,
    minLength: 1,
    maxLength: 255,
    required: false
  },

  // Timestamp Rules
  timestamp: {
    field: 'timestamp',
    type: 'number' as const,
    min: 0,
    required: true
  },

  // Content Rules
  content: {
    field: 'content',
    type: 'string' as const,
    minLength: 1,
    maxLength: 100000,
    required: true,
    sanitize: true
  },

  // Key Management Rules
  keyId: {
    field: 'keyId',
    type: 'string' as const,
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: true
  },

  signature: {
    field: 'signature',
    type: 'string' as const,
    minLength: 1,
    required: true
  },

  // Bedau Index Rules
  bedauIndex: {
    field: 'bedauIndex',
    type: 'number' as const,
    min: 0,
    max: 1,
    required: true
  },

  emergenceType: {
    field: 'emergenceType',
    type: 'string' as const,
    allowedValues: ['LINEAR', 'WEAK_EMERGENCE', 'HIGH_WEAK_EMERGENCE'],
    required: true
  },

  // Pagination Rules
  page: {
    field: 'page',
    type: 'number' as const,
    min: 1,
    required: false
  },

  limit: {
    field: 'limit',
    type: 'number' as const,
    min: 1,
    max: 1000,
    required: false
  },

  // Email Rules
  email: {
    field: 'email',
    type: 'string' as const,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true
  },

  // API Key Rules
  apiKey: {
    field: 'apiKey',
    type: 'string' as const,
    minLength: 32,
    maxLength: 256,
    pattern: /^[a-zA-Z0-9_-]+$/,
    required: true
  }
};

/**
 * Common sanitizers
 */
export const Sanitizers = {
  // HTML sanitization
  html: (value: string): string => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // SQL injection prevention
  sql: (value: string): string => {
    return value.replace(/['"\\]/g, '\\$&');
  },

  // XSS prevention
  xss: (value: string): string => {
    return value.replace(/[<>]/g, '');
  },

  // Trim whitespace
  trim: (value: string): string => {
    return value.trim();
  },

  // Lowercase
  lowercase: (value: string): string => {
    return value.toLowerCase();
  },

  // Uppercase
  uppercase: (value: string): string => {
    return value.toUpperCase();
  },

  // Remove special characters
  alphanumeric: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  }
};

/**
 * Schema definitions for common use cases
 */
export const Schemas = {
  trustProtocol: [
    ValidationRules.trustScore,
    ValidationRules.sessionId,
    ValidationRules.userId,
    ValidationRules.timestamp
  ],

  trustReceipt: [
    ValidationRules.sessionId,
    ValidationRules.userId,
    ValidationRules.timestamp,
    ValidationRules.keyId,
    ValidationRules.signature
  ],

  bedauIndex: [
    ValidationRules.bedauIndex,
    ValidationRules.emergenceType,
    ValidationRules.sessionId,
    ValidationRules.timestamp
  ],

  emergenceDetection: [
    ValidationRules.sessionId,
    ValidationRules.userId,
    ValidationRules.content,
    ValidationRules.timestamp
  ],

  keyGeneration: [
    ValidationRules.userId,
    ValidationRules.tenantId
  ],

  keySigning: [
    ValidationRules.keyId,
    ValidationRules.signature
  ],

  auditQuery: [
    ValidationRules.sessionId,
    ValidationRules.userId,
    ValidationRules.tenantId,
    ValidationRules.page,
    ValidationRules.limit
  ],

  userAuthentication: [
    ValidationRules.email,
    ValidationRules.userId
  ],

  apiRequest: [
    ValidationRules.apiKey
  ]
};

/**
 * Create a pre-configured validator with common schemas
 */
export function createValidator(): InputValidator {
  const validator = new InputValidator();

  // Register common schemas
  Object.entries(Schemas).forEach(([name, rules]) => {
    validator.registerRules(name, rules);
  });

  // Register common sanitizers
  validator.registerSanitizer('content', Sanitizers.html);
  validator.registerSanitizer('content', Sanitizers.xss);
  validator.registerSanitizer('content', Sanitizers.trim);
  validator.registerSanitizer('email', Sanitizers.trim);
  validator.registerSanitizer('email', Sanitizers.lowercase);
  validator.registerSanitizer('sessionId', Sanitizers.trim);

  return validator;
}

/**
 * Global validator instance
 */
export const validator = createValidator();

/**
 * Helper function for quick validation
 */
export async function validateInput(
  schema: string,
  data: Record<string, any>
): Promise<void> {
  const result = await validator.validate(schema, data);
  if (!result.valid) {
    const error = result.errors[0];
    throw error;
  }
}

/**
 * Decorator for validating method inputs
 */
export function ValidateSchema(schemaName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Validate first argument if it's an object
      if (args.length > 0 && typeof args[0] === 'object') {
        const result = await validator.validate(schemaName, args[0]);
        if (!result.valid) {
          throw result.errors[0];
        }
        // Use sanitized data if available
        if (result.sanitized) {
          args[0] = result.sanitized;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}