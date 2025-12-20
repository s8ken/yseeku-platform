import { NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@sonate/persistence';
import { Env } from '@sonate/orchestrate';
import { initializeAuditPersistence } from '@sonate/orchestrate/src/security/audit-init';
import Redis from 'ioredis';

export async function GET() {
  const dbUrl = Env.DATABASE_URL();
  const redisUrl = Env.REDIS_URL();
  const status: any = {
    dbConfigured: !!dbUrl,
    redisConfigured: !!redisUrl,
    timestamp: new Date().toISOString()
  };

  // Database health check
  try {
    await initializeAuditPersistence();
    const pool = getPool();
    if (pool) {
      await ensureSchema();
      const res = await pool.query('SELECT 1 as ok');
      status.dbConnected = res.rows[0]?.ok === 1;
    } else {
      status.dbConnected = false;
    }
  } catch (err) {
    status.dbConnected = false;
    status.dbError = (err as Error).message;
  }

  // Redis health check
  try {
    if (redisUrl) {
      const redis = new Redis(redisUrl);
      await redis.ping();
      status.redisConnected = true;
      redis.disconnect();
    } else {
      status.redisConnected = false;
    }
  } catch (err) {
    status.redisConnected = false;
    status.redisError = (err as Error).message;
  }

  // Overall health status
  status.healthy = status.dbConnected && (status.redisConnected !== false);

  return NextResponse.json(status);
}
