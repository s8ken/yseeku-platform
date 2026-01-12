import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (pool) return pool;
  
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.warn('No database URL configured');
    return null;
  }

  // Handle Railway's potentially incorrect URL interpolation if it starts with "base"
  let connectionString = url;
  if (url.startsWith('postgresql://base')) {
    console.warn('Detected potentially malformed DATABASE_URL starting with "base". Attempting to fix...');
    connectionString = url.replace('postgresql://base', 'postgresql://postgres');
  }
  
  try {
    pool = new Pool({ connectionString });
    console.log('PostgreSQL pool initialized');
    
    // Provision schema and admin after pool is initialized
    (async () => {
      try {
        console.log('Starting database initialization process...');
        // Execute schema creation directly to ensure it happens before auth check
        const client = await pool!.connect();
        try {
          console.log('Connected to database for schema creation');
          await client.query(`
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
              symbi_dimensions JSONB,
              last_interaction TIMESTAMPTZ DEFAULT NOW(),
              interaction_count INTEGER DEFAULT 0,
              tenant_id TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT,
              name TEXT,
              password_hash TEXT,
              role TEXT DEFAULT 'viewer',
              tenant_id TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT REFERENCES users(id),
              token TEXT UNIQUE NOT NULL,
              expires_at TIMESTAMPTZ NOT NULL,
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
              tenant_id TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS risk_events (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              severity TEXT DEFAULT 'warning',
              description TEXT,
              category TEXT DEFAULT 'operational',
              resolved BOOLEAN DEFAULT false,
              resolved_at TIMESTAMPTZ,
              tenant_id TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              event TEXT NOT NULL,
              status TEXT NOT NULL,
              details JSONB,
              tenant_id TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS trust_settings (
              tenant_id TEXT PRIMARY KEY,
              settings JSONB NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `);
          console.log('Database schema verified/created successfully');
        } finally {
          client.release();
        }

        console.log('Importing auth module for admin provisioning...');
        const { ensureDefaultAdmin } = await import('./auth');
        console.log('Calling ensureDefaultAdmin...');
        await ensureDefaultAdmin();
        console.log('Database initialization process complete');
      } catch (err) {
        console.error('CRITICAL: Failed to initialize database:', err);
      }
    })();

    return pool;
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err);
    return null;
  }
}

export async function ensureSchema(): Promise<void> {
  const p = getPool();
  if (!p) return;
  
  try {
    await p.query(`
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
        symbi_dimensions JSONB,
        last_interaction TIMESTAMPTZ DEFAULT NOW(),
        interaction_count INTEGER DEFAULT 0,
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'viewer',
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
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS risk_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        severity TEXT DEFAULT 'warning',
        description TEXT,
        category TEXT DEFAULT 'operational',
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMPTZ,
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        type TEXT DEFAULT 'a_b_test',
        variant_a JSONB,
        variant_b JSONB,
        sample_size INTEGER DEFAULT 1000,
        current_sample INTEGER DEFAULT 0,
        statistical_power NUMERIC(5,2) DEFAULT 0.80,
        p_value NUMERIC(10,8),
        winner TEXT,
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT,
        event TEXT,
        resource_type TEXT,
        resource_id TEXT,
        user_id TEXT,
        user_email TEXT,
        status TEXT,
        details JSONB,
        ip_address TEXT,
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS trust_settings (
        tenant_id TEXT PRIMARY KEY,
        settings JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('Schema creation error:', err);
  }
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  status: string;
  compliance_status: string;
  trust_score: number;
  created_at: Date;
  last_activity: Date;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  trust_score: number;
  symbi_dimensions: {
    reality_index: number;
    trust_protocol: string;
    ethical_alignment: number;
    resonance_quality: string;
    canvas_parity: number;
  };
  last_interaction: Date;
  interaction_count: number;
  tenant_id: string | null;
  created_at: Date;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const defaultSymbiDimensions = {
  reality_index: 8.0,
  trust_protocol: 'PASS',
  ethical_alignment: 4.0,
  resonance_quality: 'STRONG',
  canvas_parity: 85
};

export async function createTenant(input: { name: string; description?: string }): Promise<Tenant | null> {
  const p = getPool();
  if (!p) return null;
  
  const id = generateId('tenant');
  const now = new Date();
  
  try {
    await p.query(
      `INSERT INTO tenants (id, name, description, status, compliance_status, trust_score, created_at, last_activity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, input.name, input.description || '', 'active', 'compliant', 85, now, now]
    );
    
    return {
      id,
      name: input.name,
      description: input.description || '',
      status: 'active',
      compliance_status: 'compliant',
      trust_score: 85,
      created_at: now,
      last_activity: now
    };
  } catch (err) {
    console.error('Create tenant error:', err);
    return null;
  }
}

export async function getTenants(): Promise<Tenant[]> {
  const p = getPool();
  if (!p) return [];
  
  try {
    const res = await p.query(
      `SELECT id, name, description, status, compliance_status, trust_score, created_at, last_activity 
       FROM tenants ORDER BY created_at DESC`
    );
    
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      status: row.status,
      compliance_status: row.compliance_status,
      trust_score: row.trust_score,
      created_at: new Date(row.created_at),
      last_activity: new Date(row.last_activity)
    }));
  } catch (err) {
    console.error('Get tenants error:', err);
    return [];
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const p = getPool();
  if (!p) return null;
  
  try {
    const res = await p.query(
      `SELECT id, name, description, status, compliance_status, trust_score, created_at, last_activity 
       FROM tenants WHERE id = $1`,
      [id]
    );
    
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      status: row.status,
      compliance_status: row.compliance_status,
      trust_score: row.trust_score,
      created_at: new Date(row.created_at),
      last_activity: new Date(row.last_activity)
    };
  } catch (err) {
    console.error('Get tenant error:', err);
    return null;
  }
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const p = getPool();
  if (!p) return null;
  
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.compliance_status !== undefined) {
    fields.push(`compliance_status = $${idx++}`);
    values.push(updates.compliance_status);
  }
  if (updates.trust_score !== undefined) {
    fields.push(`trust_score = $${idx++}`);
    values.push(updates.trust_score);
  }
  
  fields.push(`last_activity = $${idx++}`);
  values.push(new Date());
  
  if (fields.length === 0) return getTenantById(id);
  
  values.push(id);
  
  try {
    await p.query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    return getTenantById(id);
  } catch (err) {
    console.error('Update tenant error:', err);
    return null;
  }
}

export async function deleteTenant(id: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  
  try {
    const res = await p.query('DELETE FROM tenants WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  } catch (err) {
    console.error('Delete tenant error:', err);
    return false;
  }
}

export async function getTenantUserCount(tenantId: string): Promise<number> {
  const p = getPool();
  if (!p) return 0;
  
  try {
    const res = await p.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  } catch (err) {
    console.error('Get user count error:', err);
    return 0;
  }
}

export async function createAgent(input: { name: string; type?: string; tenant_id?: string }): Promise<Agent | null> {
  const p = getPool();
  if (!p) return null;
  
  const id = generateId('agent');
  const now = new Date();
  
  try {
    await p.query(
      `INSERT INTO agents (id, name, type, status, trust_score, symbi_dimensions, last_interaction, interaction_count, tenant_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, input.name, input.type || 'general', 'active', 80, JSON.stringify(defaultSymbiDimensions), now, 0, input.tenant_id || null, now]
    );
    
    return {
      id,
      name: input.name,
      type: input.type || 'general',
      status: 'active',
      trust_score: 80,
      symbi_dimensions: defaultSymbiDimensions,
      last_interaction: now,
      interaction_count: 0,
      tenant_id: input.tenant_id || null,
      created_at: now
    };
  } catch (err) {
    console.error('Create agent error:', err);
    return null;
  }
}

export async function getAgents(tenantId?: string): Promise<Agent[]> {
  const p = getPool();
  if (!p) return [];
  
  try {
    let query = `SELECT id, name, type, status, trust_score, symbi_dimensions, last_interaction, interaction_count, tenant_id, created_at 
                 FROM agents`;
    const params: any[] = [];
    
    if (tenantId) {
      query += ' WHERE tenant_id = $1';
      params.push(tenantId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const res = await p.query(query, params);
    
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type || 'general',
      status: row.status,
      trust_score: row.trust_score,
      symbi_dimensions: row.symbi_dimensions || defaultSymbiDimensions,
      last_interaction: new Date(row.last_interaction),
      interaction_count: row.interaction_count,
      tenant_id: row.tenant_id,
      created_at: new Date(row.created_at)
    }));
  } catch (err) {
    console.error('Get agents error:', err);
    return [];
  }
}
