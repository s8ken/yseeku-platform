import { getPool } from './db';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'suspended';
  trust_score: number;
  sonate_dimensions: {
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

export interface CreateAgentInput {
  name: string;
  type?: string;
  tenant_id?: string;
}

function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const defaultSonateDimensions = {
  reality_index: 8.0,
  trust_protocol: 'PASS',
  ethical_alignment: 4.0,
  resonance_quality: 'STRONG',
  canvas_parity: 85,
};

export async function createAgent(input: CreateAgentInput): Promise<Agent | null> {
  const pool = getPool();
  if (!pool) {return null;}

  const id = generateId();
  const now = new Date();

  await pool.query(
    `INSERT INTO agents (id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      input.name,
      input.type || 'general',
      'active',
      80,
      JSON.stringify(defaultSonateDimensions),
      now,
      0,
      input.tenant_id || null,
      now,
    ]
  );

  return {
    id,
    name: input.name,
    type: input.type || 'general',
    status: 'active',
    trust_score: 80,
    sonate_dimensions: defaultSonateDimensions,
    last_interaction: now,
    interaction_count: 0,
    tenant_id: input.tenant_id || null,
    created_at: now,
  };
}

export async function getAgents(tenantId?: string): Promise<Agent[]> {
  const pool = getPool();
  if (!pool) {return [];}

  let query = `SELECT id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at 
               FROM agents`;
  const params: any[] = [];

  if (tenantId) {
    query += ' WHERE tenant_id = $1';
    params.push(tenantId);
  }

  query += ' ORDER BY created_at DESC';

  const res = await pool.query(query, params);

  return res.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    trust_score: row.trust_score,
    sonate_dimensions: row.sonate_dimensions || defaultSonateDimensions,
    last_interaction: row.last_interaction,
    interaction_count: row.interaction_count,
    tenant_id: row.tenant_id,
    created_at: row.created_at,
  }));
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const pool = getPool();
  if (!pool) {return null;}

  const res = await pool.query(
    `SELECT id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at 
     FROM agents WHERE id = $1`,
    [id]
  );

  if (res.rows.length === 0) {return null;}

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    trust_score: row.trust_score,
    sonate_dimensions: row.sonate_dimensions || defaultSonateDimensions,
    last_interaction: row.last_interaction,
    interaction_count: row.interaction_count,
    tenant_id: row.tenant_id,
    created_at: row.created_at,
  };
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
  const pool = getPool();
  if (!pool) {return null;}

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    fields.push(`type = $${idx++}`);
    values.push(updates.type);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.trust_score !== undefined) {
    fields.push(`trust_score = $${idx++}`);
    values.push(updates.trust_score);
  }
  if (updates.sonate_dimensions !== undefined) {
    fields.push(`sonate_dimensions = $${idx++}`);
    values.push(JSON.stringify(updates.sonate_dimensions));
  }
  if (updates.interaction_count !== undefined) {
    fields.push(`interaction_count = $${idx++}`);
    values.push(updates.interaction_count);
  }

  fields.push(`last_interaction = $${idx++}`);
  values.push(new Date());

  if (fields.length === 0) {return getAgentById(id);}

  values.push(id);
  await pool.query(`UPDATE agents SET ${fields.join(', ')} WHERE id = $${idx}`, values);

  return getAgentById(id);
}

export async function deleteAgent(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) {return false;}

  const res = await pool.query('DELETE FROM agents WHERE id = $1', [id]);
  return res.rowCount > 0;
}

export async function recordInteraction(
  agentId: string,
  sonateDimensions?: Agent['sonate_dimensions']
): Promise<void> {
  const pool = getPool();
  if (!pool) {return;}

  const updates: string[] = [
    'interaction_count = interaction_count + 1',
    'last_interaction = NOW()',
  ];
  const values: any[] = [agentId];

  if (sonateDimensions) {
    updates.push(`sonate_dimensions = $2`);
    values.push(JSON.stringify(sonateDimensions));
  }

  await pool.query(`UPDATE agents SET ${updates.join(', ')} WHERE id = $1`, values);
}
