import { getLogger } from '../observability/logger';

const logger = getLogger('EnvConfig');

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    logger.warn(`Missing required env var: ${name}`);
  }
  return v || '';
}

export const Env = {
  DATABASE_URL: (): string | undefined => process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined,
  REDIS_URL: (): string | undefined => process.env.REDIS_URL || undefined,
  JWT_SECRET: (): string => required('JWT_SECRET'),
  NODE_ENV: (): string => process.env.NODE_ENV || 'development',
};

export function validateCritical(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!Env.JWT_SECRET()) missing.push('JWT_SECRET');
  return { ok: missing.length === 0, missing };
}
