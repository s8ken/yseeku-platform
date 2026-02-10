"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.getEnvConfig = getEnvConfig;
/**
 * Environment Variable Validation
 * Fails fast if required configuration is missing
 */
const logger_1 = require("../utils/logger");
/**
 * Required environment variables for the application to run
 */
const REQUIRED_ENV_VARS = ['NODE_ENV'];
/**
 * Recommended environment variables (warn if missing)
 */
const RECOMMENDED_ENV_VARS = ['SONATE_PUBLIC_KEY', 'DATABASE_URL'];
/**
 * Validate that required environment variables are present
 * @throws Error if required variables are missing
 */
function validateEnvironment() {
    const missing = [];
    const warnings = [];
    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    // Check recommended variables
    for (const varName of RECOMMENDED_ENV_VARS) {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    }
    // Fail if required variables are missing
    if (missing.length > 0) {
        logger_1.logger.error('Missing required environment variables', { missing });
        logger_1.logger.error('Set these in your .env file or environment.');
        process.exit(1);
    }
    // Warn if recommended variables are missing
    if (warnings.length > 0) {
        logger_1.logger.warn('Missing recommended environment variables', { warnings });
        logger_1.logger.warn('Application may have limited functionality.');
    }
    // Validate NODE_ENV value
    const validEnvs = ['development', 'staging', 'production'];
    if (!process.env.NODE_ENV || !validEnvs.includes(process.env.NODE_ENV)) {
        logger_1.logger.error(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
        process.exit(1);
    }
    logger_1.logger.info('Environment validated', { node_env: process.env.NODE_ENV });
    return {
        NODE_ENV: process.env.NODE_ENV,
        SONATE_PUBLIC_KEY: process.env.SONATE_PUBLIC_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        PORT: process.env.PORT || '3000',
    };
}
/**
 * Get validated environment configuration
 * Call this at application startup
 */
function getEnvConfig() {
    return validateEnvironment();
}
