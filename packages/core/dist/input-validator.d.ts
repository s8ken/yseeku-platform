/**
 * Comprehensive Input Validation Framework
 *
 * Provides enterprise-grade input validation for all public APIs
 * Includes type checking, range validation, format validation, and sanitization
 */
import { ValidationError } from './errors';
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
export declare class InputValidator {
    private rules;
    private sanitizers;
    /**
     * Register validation rules for a schema
     */
    registerRules(schemaName: string, rules: ValidationRule[]): void;
    /**
     * Register a custom sanitizer
     */
    registerSanitizer(field: string, sanitizer: (value: any) => any): void;
    /**
     * Validate data against a schema
     */
    validate(schemaName: string, data: Record<string, any>): Promise<ValidationResult>;
    /**
     * Validate type
     */
    private validateType;
    /**
     * Validate a single field
     */
    validateField(field: string, value: any, rule: ValidationRule): Promise<boolean>;
}
/**
 * Common validation rules
 */
export declare const ValidationRules: {
    trustScore: {
        field: string;
        type: "number";
        min: number;
        max: number;
        required: boolean;
    };
    principleScore: {
        field: string;
        type: "number";
        min: number;
        max: number;
        required: boolean;
    };
    sessionId: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        pattern: RegExp;
        required: boolean;
    };
    userId: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    };
    tenantId: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    };
    timestamp: {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    };
    content: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
        sanitize: boolean;
    };
    keyId: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        pattern: RegExp;
        required: boolean;
    };
    signature: {
        field: string;
        type: "string";
        minLength: number;
        required: boolean;
    };
    bedauIndex: {
        field: string;
        type: "number";
        min: number;
        max: number;
        required: boolean;
    };
    emergenceType: {
        field: string;
        type: "string";
        allowedValues: string[];
        required: boolean;
    };
    page: {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    };
    limit: {
        field: string;
        type: "number";
        min: number;
        max: number;
        required: boolean;
    };
    email: {
        field: string;
        type: "string";
        pattern: RegExp;
        required: boolean;
    };
    apiKey: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        pattern: RegExp;
        required: boolean;
    };
};
/**
 * Common sanitizers
 */
export declare const Sanitizers: {
    html: (value: string) => string;
    sql: (value: string) => string;
    xss: (value: string) => string;
    trim: (value: string) => string;
    lowercase: (value: string) => string;
    uppercase: (value: string) => string;
    alphanumeric: (value: string) => string;
};
/**
 * Schema definitions for common use cases
 */
export declare const Schemas: {
    trustProtocol: ({
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    } | {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    })[];
    trustReceipt: ({
        field: string;
        type: "number";
        min: number;
        required: boolean;
    } | {
        field: string;
        type: "string";
        minLength: number;
        required: boolean;
    })[];
    bedauIndex: ({
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        pattern: RegExp;
        required: boolean;
    } | {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    } | {
        field: string;
        type: "string";
        allowedValues: string[];
        required: boolean;
    })[];
    emergenceDetection: ({
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    } | {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    })[];
    keyGeneration: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    }[];
    keySigning: {
        field: string;
        type: "string";
        minLength: number;
        required: boolean;
    }[];
    auditQuery: ({
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    } | {
        field: string;
        type: "number";
        min: number;
        required: boolean;
    })[];
    userAuthentication: ({
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        required: boolean;
    } | {
        field: string;
        type: "string";
        pattern: RegExp;
        required: boolean;
    })[];
    apiRequest: {
        field: string;
        type: "string";
        minLength: number;
        maxLength: number;
        pattern: RegExp;
        required: boolean;
    }[];
};
/**
 * Create a pre-configured validator with common schemas
 */
export declare function createValidator(): InputValidator;
/**
 * Global validator instance
 */
export declare const validator: InputValidator;
/**
 * Helper function for quick validation
 */
export declare function validateInput(schema: string, data: Record<string, any>): Promise<void>;
/**
 * Decorator for validating method inputs
 */
export declare function ValidateSchema(schemaName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
