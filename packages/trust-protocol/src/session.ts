import { randomBytes, randomUUID } from 'crypto';

/**
 * CSPRNG 32-byte nonce → 2^256 collision resistance
 * RFC 4122 v4 UUID compliant for session binding
 */
export interface SessionContext {
  session_id: string;
  nonce: string;        // 64 hex chars (32 bytes)
  ttl_ms: number;       // 24h default
  created: number;      // Unix timestamp
}

export function generateSessionContext(): SessionContext {
  const session_id = randomUUID();
  const nonce = randomBytes(32).toString('hex');
  const created = Date.now();
  
  return {
    session_id,
    nonce,
    ttl_ms: 24 * 60 * 60 * 1000, // 24h
    created
  };
}

export function isSessionValid(ctx: SessionContext): boolean {
  return Date.now() - ctx.created < ctx.ttl_ms;
}
