import { getLogger } from '@sonate/orchestrate';

let pool: any | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function getPool(): any | null {
  if (pool) return pool;
  const url = getDatabaseUrl();
  if (!url) {
    return null;
  }
  const logger = getLogger('Persistence');
  try {
    // Use dynamic require to avoid TS type dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pg = require('pg');
    pool = new pg.Pool({ connectionString: url });
    logger.info('PostgreSQL pool initialized');
    return pool;
  } catch (err) {
    logger.error('Failed to initialize PostgreSQL pool', { err });
    return null;
  }
}

export async function ensureSchema(): Promise<void> {
  const p = getPool();
  if (!p) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      tenant_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trust_receipts (
      self_hash TEXT PRIMARY KEY,
      session_id TEXT,
      version TEXT,
      timestamp BIGINT,
      mode TEXT,
      ciq JSONB,
      previous_hash TEXT,
      signature TEXT,
      tenant_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_session ON trust_receipts(session_id);
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event TEXT,
      status TEXT,
      details JSONB,
      tenant_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE trust_receipts ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);
}
