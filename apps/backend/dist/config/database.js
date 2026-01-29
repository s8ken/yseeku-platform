"use strict";
/**
 * Database Configuration
 * MongoDB connection setup with retry logic
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const metrics_1 = require("../observability/metrics");
const logger_1 = __importDefault(require("../utils/logger"));
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/yseeku-platform';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds
let retryCount = 0;
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // Increased from 5s to 30s for Railway network latency
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000, // Added connection timeout
            maxPoolSize: 10, // Connection pool settings
            minPoolSize: 2,
        });
        logger_1.default.info('MongoDB connected', { host: mongoose_1.default.connection.host });
        retryCount = 0; // Reset retry count on successful connection
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error', { error: err.message });
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(reconnect, RETRY_INTERVAL);
        });
        // Instrument query execution durations globally
        const originalExec = mongoose_1.default.Query.prototype.exec;
        mongoose_1.default.Query.prototype.exec = async function (...args) {
            const start = process.hrtime.bigint();
            try {
                return await originalExec.apply(this, args);
            }
            finally {
                const end = process.hrtime.bigint();
                const durationSec = Number(end - start) / 1e9;
                const op = this.op || 'query';
                const coll = this.model?.collection?.name || 'unknown';
                (0, metrics_1.recordDbQuery)(op, coll, durationSec);
            }
        };
    }
    catch (error) {
        logger_1.default.error('MongoDB connection failed', {
            attempt: retryCount + 1,
            maxRetries: MAX_RETRIES,
            error: error.message
        });
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            logger_1.default.info('Retrying MongoDB connection', { retryIn: `${RETRY_INTERVAL / 1000}s` });
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            return connectDatabase(); // Retry
        }
        else {
            logger_1.default.error('Max connection retries reached. Server will continue without database.');
            // Don't exit - let the server keep running for health checks
            // Features requiring DB will fail gracefully
            throw new Error('MongoDB connection failed after max retries');
        }
    }
}
async function reconnect() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        logger_1.default.info('MongoDB reconnected successfully');
    }
    catch (error) {
        logger_1.default.error('MongoDB reconnection failed', { error: error.message });
        setTimeout(reconnect, RETRY_INTERVAL);
    }
}
async function disconnectDatabase() {
    try {
        await mongoose_1.default.disconnect();
        logger_1.default.info('MongoDB disconnected');
    }
    catch (error) {
        logger_1.default.error('Error disconnecting from MongoDB', { error: error.message });
        throw error;
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
});
