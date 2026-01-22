// Simple tenant context mock to avoid circular dependencies
const tenantContext = {
  getTenantId: (throwOnError: boolean = false): string | null => {
    return process.env.TENANT_ID || null;
  },
};

// Simple logger implementation to avoid circular dependencies
function getLogger(component: string) {
  return {
    info: (message: string, data?: any) => console.log(`[${component}] ${message}`, data || ''),
    error: (message: string, data?: any) => console.error(`[${component}] ${message}`, data || ''),
    warn: (message: string, data?: any) => console.warn(`[${component}] ${message}`, data || ''),
    debug: (message: string, data?: any) => console.debug(`[${component}] ${message}`, data || ''),
  };
}

/**
 * Helper to get the current tenant ID from context or provided value
 */
export function resolveTenantId(providedId?: string): string | null {
  if (providedId) {return providedId;}
  try {
    return tenantContext.getTenantId(false) || null;
  } catch {
    return null;
  }
}

let pool: any | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function getPool(): any | null {
  const url = getDatabaseUrl();
  if (!url) {
    pool = null;
    return null;
  }
  if (pool) {return pool;}
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
  if (!p) {return;}
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      password_hash TEXT,
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
      session_nonce TEXT,
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
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      compliance_status TEXT DEFAULT 'compliant',
      trust_score INTEGER DEFAULT 85,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_activity TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      status TEXT DEFAULT 'active',
      trust_score INTEGER DEFAULT 80,
      sonate_dimensions JSONB,
      last_interaction TIMESTAMPTZ DEFAULT NOW(),
      interaction_count INTEGER DEFAULT 0,
      tenant_id TEXT REFERENCES tenants(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hypothesis TEXT,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      variants JSONB,
      results JSONB,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      tenant_id TEXT REFERENCES tenants(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS risk_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      agent_id TEXT REFERENCES agents(id),
      details JSONB,
      resolved BOOLEAN DEFAULT false,
      tenant_id TEXT REFERENCES tenants(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE trust_receipts ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT;
  `);
}

export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
  const p = getPool();
  if (!p) {
    return { status: 'unhealthy', message: 'Database pool not initialized' };
  }
  try {
    await p.query('SELECT 1');
    return { status: 'healthy', message: 'Database connection is healthy' };
  } catch (err) {
    return { status: 'unhealthy', message: `Database health check failed: ${err}` };
  }
}

export async function initializeDatabase(): Promise<void> {
  const { runMigrations } = await import('./migrations');
  await runMigrations();
}
