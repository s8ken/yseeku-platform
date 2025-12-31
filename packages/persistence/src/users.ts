import { getPool } from './db';
import bcrypt from 'bcrypt';

export interface UserRecord {
  id: string;
  email?: string;
  name?: string;
  passwordHash?: string;
}

export async function upsertUser(user: UserRecord): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(
    `INSERT INTO users(id, email, name, password_hash)
     VALUES($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
    [user.id, user.email || null, user.name || null, user.passwordHash || null]
  );
  return true;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE id = $1',
    [username]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
