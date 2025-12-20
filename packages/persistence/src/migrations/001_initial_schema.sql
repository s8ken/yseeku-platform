-- Initial schema for persistence layer

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