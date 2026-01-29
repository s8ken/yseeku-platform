"use strict";
/**
 * Request Validation Middleware
 *
 * Uses Zod schemas to validate request bodies, query params, and route params.
 * Provides consistent validation error responses.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.validate = validate;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Format Zod errors into a consistent structure
 */
function formatZodError(error) {
    return {
        success: false,
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.issues.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code,
            })),
        },
    };
}
/**
 * Middleware factory for validating request body
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                logger_1.default.warn('Request body validation failed', {
                    path: req.path,
                    method: req.method,
                    errors: result.error.issues,
                });
                res.status(400).json(formatZodError(result.error));
                return;
            }
            // Replace body with parsed/transformed data
            req.body = result.data;
            next();
        }
        catch (error) {
            logger_1.default.error('Validation middleware error', { error });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
            });
        }
    };
}
/**
 * Middleware factory for validating query parameters
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.query);
            if (!result.success) {
                logger_1.default.warn('Query params validation failed', {
                    path: req.path,
                    method: req.method,
                    errors: result.error.issues,
                });
                res.status(400).json(formatZodError(result.error));
                return;
            }
            // Replace query with parsed/transformed data
            req.query = result.data;
            next();
        }
        catch (error) {
            logger_1.default.error('Query validation middleware error', { error });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
            });
        }
    };
}
/**
 * Middleware factory for validating route parameters
 */
function validateParams(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.params);
            if (!result.success) {
                logger_1.default.warn('Route params validation failed', {
                    path: req.path,
                    method: req.method,
                    errors: result.error.issues,
                });
                res.status(400).json(formatZodError(result.error));
                return;
            }
            req.params = result.data;
            next();
        }
        catch (error) {
            logger_1.default.error('Params validation middleware error', { error });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Validation failed unexpectedly' },
            });
        }
    };
}
/**
 * Combined validation for body, query, and params
 */
function validate(schemas) {
    return (req, res, next) => {
        const errors = [];
        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) {
                errors.push({ location: 'params', issues: result.error.issues });
            }
            else {
                req.params = result.data;
            }
        }
        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) {
                errors.push({ location: 'query', issues: result.error.issues });
            }
            else {
                req.query = result.data;
            }
        }
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) {
                errors.push({ location: 'body', issues: result.error.issues });
            }
            else {
                req.body = result.data;
            }
        }
        if (errors.length > 0) {
            logger_1.default.warn('Request validation failed', {
                path: req.path,
                method: req.method,
                errors,
            });
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: errors.flatMap((e) => e.issues.map((issue) => ({
                        location: e.location,
                        path: issue.path.join('.'),
                        message: issue.message,
                        code: issue.code,
                    }))),
                },
            });
            return;
        }
        next();
    };
}
exports.default = { validateBody, validateQuery, validateParams, validate };
