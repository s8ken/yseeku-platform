import { getPool } from './db';

export interface UserRecord {
  id: string;
  email?: string;
  name?: string;
}

export async function upsertUser(user: UserRecord): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(
    `INSERT INTO users(id, email, name)
     VALUES($1,$2,$3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
    [user.id, user.email || null, user.name || null]
  );
  return true;
}
