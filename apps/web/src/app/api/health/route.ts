import { NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@sonate/persistence';
import { Env } from '@sonate/orchestrate';
import { initializeAuditPersistence } from '@sonate/orchestrate/src/security/audit-init';

export async function GET() {
  const dbUrl = Env.DATABASE_URL();
  const status: any = { dbConfigured: !!dbUrl };
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
    status.error = (err as Error).message;
  }
  return NextResponse.json(status);
}
