import { getPool } from './db';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error('Database pool not available');

  // Create migrations table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Get applied migrations
  const appliedRes = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  const appliedVersions = new Set(appliedRes.rows.map((r: any) => r.version));

  // Get migration files
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const version = path.basename(file, '.sql');
    if (appliedVersions.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
  }
}

export async function getMigrationStatus(): Promise<{ version: string; applied_at: Date }[]> {
  const pool = getPool();
  if (!pool) return [];
  const res = await pool.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
  return res.rows.map((r: any) => ({ version: r.version, applied_at: r.applied_at }));
}