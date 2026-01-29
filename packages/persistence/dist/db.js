"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenantId = resolveTenantId;
exports.getDatabaseUrl = getDatabaseUrl;
exports.getPool = getPool;
exports.ensureSchema = ensureSchema;
exports.healthCheck = healthCheck;
exports.initializeDatabase = initializeDatabase;
// Simple tenant context mock to avoid circular dependencies
const tenantContext = {
    getTenantId: (throwOnError = false) => {
        return process.env.TENANT_ID || null;
    },
};
// Simple logger implementation to avoid circular dependencies
function getLogger(component) {
    return {
        info: (message, data) => console.log(`[${component}] ${message}`, data || ''),
        error: (message, data) => console.error(`[${component}] ${message}`, data || ''),
        warn: (message, data) => console.warn(`[${component}] ${message}`, data || ''),
        debug: (message, data) => console.debug(`[${component}] ${message}`, data || ''),
    };
}
/**
 * Helper to get the current tenant ID from context or provided value
 */
function resolveTenantId(providedId) {
    if (providedId) {
        return providedId;
    }
    try {
        return tenantContext.getTenantId(false) || null;
    }
    catch {
        return null;
    }
}
let pool = null;
function getDatabaseUrl() {
    return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}
function getPool() {
    const url = getDatabaseUrl();
    if (!url) {
        pool = null;
        return null;
    }
    if (pool) {
        return pool;
    }
    const logger = getLogger('Persistence');
    try {
        // Use dynamic require to avoid TS type dependency
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pg = require('pg');
        pool = new pg.Pool({ connectionString: url });
        logger.info('PostgreSQL pool initialized');
        return pool;
    }
    catch (err) {
        logger.error('Failed to initialize PostgreSQL pool', { err });
        return null;
    }
}
async function ensureSchema() {
    const p = getPool();
    if (!p) {
        return;
    }
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
async function healthCheck() {
    const p = getPool();
    if (!p) {
        return { status: 'unhealthy', message: 'Database pool not initialized' };
    }
    try {
        await p.query('SELECT 1');
        return { status: 'healthy', message: 'Database connection is healthy' };
    }
    catch (err) {
        return { status: 'unhealthy', message: `Database health check failed: ${err}` };
    }
}
async function initializeDatabase() {
    const { runMigrations } = await Promise.resolve().then(() => __importStar(require('./migrations')));
    await runMigrations();
}
