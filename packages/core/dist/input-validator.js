"use strict";
/**
 * Comprehensive Input Validation Framework
 *
 * Provides enterprise-grade input validation for all public APIs
 * Includes type checking, range validation, format validation, and sanitization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = exports.Schemas = exports.Sanitizers = exports.ValidationRules = exports.InputValidator = void 0;
exports.createValidator = createValidator;
exports.validateInput = validateInput;
exports.ValidateSchema = ValidateSchema;
const errors_1 = require("./errors");
/**
 * Input Validator for comprehensive validation
 */
class InputValidator {
    constructor() {
        this.rules = new Map();
        this.sanitizers = new Map();
    }
    /**
     * Register validation rules for a schema
     */
    registerRules(schemaName, rules) {
        this.rules.set(schemaName, rules);
    }
    /**
     * Register a custom sanitizer
     */
    registerSanitizer(field, sanitizer) {
        this.sanitizers.set(field, sanitizer);
    }
    /**
     * Validate data against a schema
     */
    async validate(schemaName, data) {
        const rules = this.rules.get(schemaName);
        if (!rules) {
            throw new Error(`Validation schema not found: ${schemaName}`);
        }
        const errors = [];
        const sanitized = { ...data };
        for (const rule of rules) {
            const value = data[rule.field];
            try {
                // Check required fields
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors.push(new errors_1.MissingRequiredFieldError(rule.field));
                    continue;
                }
                // Skip validation if field is optional and not provided
                if (!rule.required && (value === undefined || value === null)) {
                    continue;
                }
                // Type validation
                if (rule.type && !this.validateType(value, rule.type)) {
                    errors.push(new errors_1.InvalidInputError(rule.field, value));
                    continue;
                }
                // String length validation
                if (rule.type === 'string' && typeof value === 'string') {
                    if (rule.minLength !== undefined && value.length < rule.minLength) {
                        errors.push(new errors_1.RangeValidationError(rule.field, value.length, rule.minLength, Infinity));
                    }
                    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                        errors.push(new errors_1.RangeValidationError(rule.field, value.length, 0, rule.maxLength));
                    }
                }
                // Number range validation
                if (rule.type === 'number' && typeof value === 'number') {
                    if (rule.min !== undefined && value < rule.min) {
                        errors.push(new errors_1.RangeValidationError(rule.field, value, rule.min, Infinity));
                    }
                    if (rule.max !== undefined && value > rule.max) {
                        errors.push(new errors_1.RangeValidationError(rule.field, value, -Infinity, rule.max));
                    }
                }
                // Pattern validation
                if (rule.pattern && typeof value === 'string') {
                    if (!rule.pattern.test(value)) {
                        errors.push(new errors_1.FormatValidationError(rule.field, rule.pattern.toString()));
                    }
                }
                // Allowed values validation
                if (rule.allowedValues && !rule.allowedValues.includes(value)) {
                    errors.push(new errors_1.InvalidInputError(rule.field, value, {
                        timestamp: Date.now(),
                        metadata: { allowedValues: rule.allowedValues },
                    }));
                }
                // Custom validation
                if (rule.custom) {
                    const isValid = await rule.custom(value);
                    if (!isValid) {
                        errors.push(new errors_1.ValidationError(rule.errorMessage || `Validation failed for field: ${rule.field}`));
                    }
                }
                // Sanitization
                if (rule.sanitize) {
                    const sanitizer = this.sanitizers.get(rule.field);
                    if (sanitizer) {
                        sanitized[rule.field] = sanitizer(value);
                    }
                }
            }
            catch (error) {
                errors.push(new errors_1.ValidationError(`Validation error for field ${rule.field}: ${error.message}`, {
                    timestamp: Date.now(),
                    metadata: { field: rule.field, originalError: error.message },
                }));
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            sanitized: errors.length === 0 ? sanitized : undefined,
        };
    }
    /**
     * Validate type
     */
    validateType(value, type) {
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
    async validateField(field, value, rule) {
        const result = await this.validate('_temp', { [field]: value });
        return result.valid;
    }
}
exports.InputValidator = InputValidator;
/**
 * Common validation rules
 */
exports.ValidationRules = {
    // Trust Protocol Rules
    trustScore: {
        field: 'trustScore',
        type: 'number',
        min: 0,
        max: 10,
        required: true,
    },
    principleScore: {
        field: 'principleScore',
        type: 'number',
        min: 0,
        max: 10,
        required: true,
    },
    // Session Rules
    sessionId: {
        field: 'sessionId',
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9_-]+$/,
        required: true,
    },
    userId: {
        field: 'userId',
        type: 'string',
        minLength: 1,
        maxLength: 255,
        required: true,
    },
    tenantId: {
        field: 'tenantId',
        type: 'string',
        minLength: 1,
        maxLength: 255,
        required: false,
    },
    // Timestamp Rules
    timestamp: {
        field: 'timestamp',
        type: 'number',
        min: 0,
        required: true,
    },
    // Content Rules
    content: {
        field: 'content',
        type: 'string',
        minLength: 1,
        maxLength: 100000,
        required: true,
        sanitize: true,
    },
    // Key Management Rules
    keyId: {
        field: 'keyId',
        type: 'string',
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9_-]+$/,
        required: true,
    },
    signature: {
        field: 'signature',
        type: 'string',
        minLength: 1,
        required: true,
    },
    // Bedau Index Rules
    bedauIndex: {
        field: 'bedauIndex',
        type: 'number',
        min: 0,
        max: 1,
        required: true,
    },
    emergenceType: {
        field: 'emergenceType',
        type: 'string',
        allowedValues: ['LINEAR', 'WEAK_EMERGENCE', 'HIGH_WEAK_EMERGENCE'],
        required: true,
    },
    // Pagination Rules
    page: {
        field: 'page',
        type: 'number',
        min: 1,
        required: false,
    },
    limit: {
        field: 'limit',
        type: 'number',
        min: 1,
        max: 1000,
        required: false,
    },
    // Email Rules
    email: {
        field: 'email',
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        required: true,
    },
    // API Key Rules
    apiKey: {
        field: 'apiKey',
        type: 'string',
        minLength: 32,
        maxLength: 256,
        pattern: /^[a-zA-Z0-9_-]+$/,
        required: true,
    },
};
/**
 * Common sanitizers
 */
exports.Sanitizers = {
    // HTML sanitization
    html: (value) => {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    },
    // SQL injection prevention
    sql: (value) => {
        return value.replace(/['"\\]/g, '\\$&');
    },
    // XSS prevention
    xss: (value) => {
        return value.replace(/[<>]/g, '');
    },
    // Trim whitespace
    trim: (value) => {
        return value.trim();
    },
    // Lowercase
    lowercase: (value) => {
        return value.toLowerCase();
    },
    // Uppercase
    uppercase: (value) => {
        return value.toUpperCase();
    },
    // Remove special characters
    alphanumeric: (value) => {
        return value.replace(/[^a-zA-Z0-9]/g, '');
    },
};
/**
 * Schema definitions for common use cases
 */
exports.Schemas = {
    trustProtocol: [
        exports.ValidationRules.trustScore,
        exports.ValidationRules.sessionId,
        exports.ValidationRules.userId,
        exports.ValidationRules.timestamp,
    ],
    trustReceipt: [
        exports.ValidationRules.sessionId,
        exports.ValidationRules.userId,
        exports.ValidationRules.timestamp,
        exports.ValidationRules.keyId,
        exports.ValidationRules.signature,
    ],
    bedauIndex: [
        exports.ValidationRules.bedauIndex,
        exports.ValidationRules.emergenceType,
        exports.ValidationRules.sessionId,
        exports.ValidationRules.timestamp,
    ],
    emergenceDetection: [
        exports.ValidationRules.sessionId,
        exports.ValidationRules.userId,
        exports.ValidationRules.content,
        exports.ValidationRules.timestamp,
    ],
    keyGeneration: [exports.ValidationRules.userId, exports.ValidationRules.tenantId],
    keySigning: [exports.ValidationRules.keyId, exports.ValidationRules.signature],
    auditQuery: [
        exports.ValidationRules.sessionId,
        exports.ValidationRules.userId,
        exports.ValidationRules.tenantId,
        exports.ValidationRules.page,
        exports.ValidationRules.limit,
    ],
    userAuthentication: [exports.ValidationRules.email, exports.ValidationRules.userId],
    apiRequest: [exports.ValidationRules.apiKey],
};
/**
 * Create a pre-configured validator with common schemas
 */
function createValidator() {
    const validator = new InputValidator();
    // Register common schemas
    Object.entries(exports.Schemas).forEach(([name, rules]) => {
        validator.registerRules(name, rules);
    });
    // Register common sanitizers
    validator.registerSanitizer('content', exports.Sanitizers.html);
    validator.registerSanitizer('content', exports.Sanitizers.xss);
    validator.registerSanitizer('content', exports.Sanitizers.trim);
    validator.registerSanitizer('email', exports.Sanitizers.trim);
    validator.registerSanitizer('email', exports.Sanitizers.lowercase);
    validator.registerSanitizer('sessionId', exports.Sanitizers.trim);
    return validator;
}
/**
 * Global validator instance
 */
exports.validator = createValidator();
/**
 * Helper function for quick validation
 */
async function validateInput(schema, data) {
    const result = await exports.validator.validate(schema, data);
    if (!result.valid) {
        const error = result.errors[0];
        throw error;
    }
}
/**
 * Decorator for validating method inputs
 */
function ValidateSchema(schemaName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            // Validate first argument if it's an object
            if (args.length > 0 && typeof args[0] === 'object') {
                const result = await exports.validator.validate(schemaName, args[0]);
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
