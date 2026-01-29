"use strict";
/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup to fail fast
 * rather than encountering cryptic errors at runtime.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.validateEnvironmentOrExit = validateEnvironmentOrExit;
const logger_1 = __importDefault(require("./logger"));
const envConfigs = [
    // Database
    {
        name: 'MONGODB_URI',
        required: false,
        defaultValue: 'mongodb://localhost:27017/yseeku-platform',
    },
    {
        name: 'MONGO_URL',
        required: false,
    },
    // Security
    {
        name: 'JWT_SECRET',
        required: true,
        sensitive: true,
        validator: (v) => v.length >= 32,
    },
    {
        name: 'JWT_REFRESH_SECRET',
        required: false,
        sensitive: true,
    },
    // Server
    {
        name: 'PORT',
        required: false,
        defaultValue: '3001',
        validator: (v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
    },
    {
        name: 'NODE_ENV',
        required: false,
        defaultValue: 'development',
        validator: (v) => ['development', 'production', 'test'].includes(v),
    },
    // CORS
    {
        name: 'CORS_ORIGIN',
        required: false,
        defaultValue: 'http://localhost:5000',
    },
    // Cryptographic Keys (optional but recommended for production)
    {
        name: 'SONATE_PUBLIC_KEY',
        required: false,
        sensitive: true,
    },
    {
        name: 'SONATE_PRIVATE_KEY',
        required: false,
        sensitive: true,
    },
];
/**
 * Validate all environment variables
 * Call this at application startup
 */
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    const applied = {};
    for (const config of envConfigs) {
        const value = process.env[config.name];
        if (!value && config.required) {
            errors.push(`Missing required environment variable: ${config.name}`);
            continue;
        }
        if (!value && config.defaultValue) {
            process.env[config.name] = config.defaultValue;
            applied[config.name] = config.defaultValue;
            logger_1.default.info(`Applied default value for ${config.name}`);
        }
        const finalValue = process.env[config.name];
        if (finalValue && config.validator && !config.validator(finalValue)) {
            errors.push(`Invalid value for environment variable: ${config.name}`);
        }
        // Production warnings
        if (process.env.NODE_ENV === 'production') {
            if (config.name === 'JWT_SECRET' && finalValue && finalValue.length < 64) {
                warnings.push('JWT_SECRET should be at least 64 characters in production');
            }
            if (config.name === 'SONATE_PRIVATE_KEY' && !finalValue) {
                warnings.push('SONATE_PRIVATE_KEY not set - trust receipts will be unsigned');
            }
        }
    }
    // Log results
    if (errors.length > 0) {
        logger_1.default.error('Environment validation failed', { errors });
    }
    if (warnings.length > 0) {
        logger_1.default.warn('Environment validation warnings', { warnings });
    }
    if (errors.length === 0) {
        logger_1.default.info('Environment validation passed', {
            appliedDefaults: Object.keys(applied).length,
            warnings: warnings.length,
        });
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        applied,
    };
}
/**
 * Validate and exit if critical errors
 * In cloud environments, we warn but continue to allow debugging via health endpoints
 */
function validateEnvironmentOrExit() {
    const result = validateEnvironment();
    if (!result.valid) {
        console.error('\n❌ Environment validation failed:');
        result.errors.forEach(err => console.error(`   - ${err}`));
        console.error('\nPlease set the required environment variables.\n');
        // In cloud environments (Fly.io, Railway), don't exit - let health check show the error
        // This allows debugging via logs and prevents silent timeouts
        const isCloud = process.env.FLY_APP_NAME || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER;
        if (isCloud) {
            console.error('⚠️  Running in cloud environment - continuing despite errors for debugging');
            logger_1.default.warn('Environment validation failed but continuing in cloud mode', { errors: result.errors });
        }
        else {
            logger_1.default.error('Exiting due to environment validation errors');
            process.exit(1);
        }
    }
}
exports.default = validateEnvironment;
