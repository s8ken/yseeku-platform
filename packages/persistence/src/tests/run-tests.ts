import { ensureSchema, getPool } from '../db';
import { saveTrustReceipt, getReceiptsBySession } from '../receipts';
import { TrustReceipt } from '@sonate/core';

async function main() {
  const pool = getPool();
  if (!pool) {
    console.log('SKIP: No DATABASE_URL, persistence tests skipped');
    return;
  }
  await ensureSchema();

  const receipt = new TrustReceipt({
    version: '1.0',
    session_id: 'test-session',
    timestamp: Date.now(),
    mode: 'constitutional',
    ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
  });
  await saveTrustReceipt(receipt);
  const rows = await getReceiptsBySession('test-session');
  console.log('OK: Persisted receipts', rows.length);
}

main().catch(err => {
  console.error('Persistence test error', err);
  process.exit(1);
});
