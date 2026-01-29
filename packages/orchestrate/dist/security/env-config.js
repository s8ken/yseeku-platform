"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
exports.validateCritical = validateCritical;
const logger_1 = require("../observability/logger");
const logger = (0, logger_1.getLogger)('EnvConfig');
function required(name) {
    const v = process.env[name];
    if (!v) {
        logger.warn(`Missing required env var: ${name}`);
    }
    return v || '';
}
exports.Env = {
    DATABASE_URL: () => process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined,
    REDIS_URL: () => process.env.REDIS_URL || undefined,
    JWT_SECRET: () => required('JWT_SECRET'),
    REFRESH_TOKEN_SECRET: () => process.env.REFRESH_TOKEN_SECRET || required('JWT_SECRET'),
    NODE_ENV: () => process.env.NODE_ENV || 'development',
};
function validateCritical() {
    const missing = [];
    if (!exports.Env.JWT_SECRET()) {
        missing.push('JWT_SECRET');
    }
    // Refresh token secret can reuse JWT_SECRET by default
    return { ok: missing.length === 0, missing };
}
