/**
 * Database Configuration
 * MongoDB connection setup with retry logic
 */

import mongoose from 'mongoose';

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

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    retryCount = 0; // Reset retry count on successful connection

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      setTimeout(reconnect, RETRY_INTERVAL);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`🔄 Retrying connection in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(connectDatabase, RETRY_INTERVAL);
    } else {
      console.error('❌ Max connection retries reached. Exiting...');
      process.exit(1);
    }
  }
}

async function reconnect(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB reconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB reconnection failed:', error);
    setTimeout(reconnect, RETRY_INTERVAL);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
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
