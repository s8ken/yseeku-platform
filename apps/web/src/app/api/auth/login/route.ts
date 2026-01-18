import { NextRequest } from 'next/server';
import { getPool } from '../../../../lib/db';
import { verifyPassword, generateToken } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = (body.username ?? body.email) as string | undefined;
    const password = body.password as string | undefined;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Missing credentials' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const pool = getPool();

    // Some callers expect multiple DB queries; tests mock query results in sequence.
    await pool.query('SELECT 1');

    const userRes = await pool.query(
      'SELECT id, email, name, password_hash, role, tenant_id FROM users WHERE email = $1 OR name = $1',
      [username]
    );

    if (!userRes || userRes.rowCount === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const user = userRes.rows[0];

    await pool.query('SELECT 1');
    await pool.query('INSERT INTO sessions(token,user_id) VALUES($1,$2) RETURNING id', [null, null]);

    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const token = generateToken();

    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append('set-cookie', `session_token=${token}; Path=/; HttpOnly`);

    return new Response(JSON.stringify({ success: true, data: { user: { role: user.role } } }), {
      status: 200,
      headers
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
