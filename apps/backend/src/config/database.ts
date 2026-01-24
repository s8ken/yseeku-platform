/**
 * Database Configuration
 * MongoDB connection setup with retry logic
 */

import mongoose from 'mongoose';
import { recordDbQuery } from '../observability/metrics';
import logger from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/yseeku-platform';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

let retryCount = 0;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected', { host: mongoose.connection.host });
    retryCount = 0; // Reset retry count on successful connection

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(reconnect, RETRY_INTERVAL);
    });

    // Instrument query execution durations globally
    const originalExec = (mongoose.Query.prototype as any).exec;
    (mongoose.Query.prototype as any).exec = async function (...args: any[]) {
      const start = process.hrtime.bigint();
      try {
        return await originalExec.apply(this, args);
      } finally {
        const end = process.hrtime.bigint();
        const durationSec = Number(end - start) / 1e9;
        const op: string = (this as any).op || 'query';
        const coll: string = (this as any).model?.collection?.name || 'unknown';
        recordDbQuery(op, coll, durationSec);
      }
    };
  } catch (error: any) {
    logger.error('MongoDB connection failed', {
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      error: error.message
    });

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info('Retrying MongoDB connection', { retryIn: `${RETRY_INTERVAL / 1000}s` });
      setTimeout(connectDatabase, RETRY_INTERVAL);
    } else {
      logger.error('Max connection retries reached. Exiting...');
      process.exit(1);
    }
  }
}

async function reconnect(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB reconnected successfully');
  } catch (error: any) {
    logger.error('MongoDB reconnection failed', { error: error.message });
    setTimeout(reconnect, RETRY_INTERVAL);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error: any) {
    logger.error('Error disconnecting from MongoDB', { error: error.message });
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
