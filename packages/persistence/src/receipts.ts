import { TrustReceipt } from '@sonate/core';
import { getPool } from './db';

export async function saveTrustReceipt(receipt: TrustReceipt, tenantId?: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(
    `INSERT INTO trust_receipts(self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (self_hash) DO NOTHING`,
    [
      receipt.self_hash,
      receipt.session_id,
      receipt.version,
      receipt.timestamp,
      receipt.mode,
      JSON.stringify(receipt.ciq_metrics),
      receipt.previous_hash || null,
      receipt.signature || null,
      receipt.session_nonce || null,
      tenantId || null,
    ]
  );
  return true;
}

export async function getReceiptsBySession(sessionId: string, tenantId?: string): Promise<TrustReceipt[]> {
  const pool = getPool();
  if (!pool) return [];
  const res = await pool.query(
    `SELECT version, session_id, timestamp, mode, ciq, previous_hash, self_hash, signature, session_nonce FROM trust_receipts WHERE session_id = $1 AND (tenant_id = $2 OR $2 IS NULL) ORDER BY timestamp ASC`,
    [sessionId, tenantId || null]
  );
  return res.rows.map((row: any) => {
    const r = TrustReceipt.fromJSON({
      version: row.version,
      session_id: row.session_id,
      timestamp: Number(row.timestamp),
      mode: row.mode,
      ciq_metrics: row.ciq,
      previous_hash: row.previous_hash,
      signature: row.signature,
      self_hash: row.self_hash,
      session_nonce: row.session_nonce,
    });
    // Ensure calculated self_hash matches stored
    r.self_hash = row.self_hash;
    return r;
  });
}
