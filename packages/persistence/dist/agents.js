"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
exports.getAgents = getAgents;
exports.getAgentById = getAgentById;
exports.updateAgent = updateAgent;
exports.deleteAgent = deleteAgent;
exports.recordInteraction = recordInteraction;
const db_1 = require("./db");
function generateId() {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
// v2.0.1: reality_index and canvas_parity are deprecated (always 0)
const defaultSonateDimensions = {
    reality_index: 0, // Deprecated in v2.0.1
    trust_protocol: 'PASS',
    ethical_alignment: 4.0,
    resonance_quality: 'STRONG',
    canvas_parity: 0, // Deprecated in v2.0.1
};
async function createAgent(input) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return null;
    }
    const id = generateId();
    const now = new Date();
    await pool.query(`INSERT INTO agents (id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
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
    ]);
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
async function getAgents(tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return [];
    }
    let query = `SELECT id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at 
               FROM agents`;
    const params = [];
    if (tenantId) {
        query += ' WHERE tenant_id = $1';
        params.push(tenantId);
    }
    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows.map((row) => ({
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
async function getAgentById(id) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return null;
    }
    const res = await pool.query(`SELECT id, name, type, status, trust_score, sonate_dimensions, last_interaction, interaction_count, tenant_id, created_at 
     FROM agents WHERE id = $1`, [id]);
    if (res.rows.length === 0) {
        return null;
    }
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
async function updateAgent(id, updates) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return null;
    }
    const fields = [];
    const values = [];
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
    if (fields.length === 0) {
        return getAgentById(id);
    }
    values.push(id);
    await pool.query(`UPDATE agents SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return getAgentById(id);
}
async function deleteAgent(id) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return false;
    }
    const res = await pool.query('DELETE FROM agents WHERE id = $1', [id]);
    return res.rowCount > 0;
}
async function recordInteraction(agentId, sonateDimensions) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return;
    }
    const updates = [
        'interaction_count = interaction_count + 1',
        'last_interaction = NOW()',
    ];
    const values = [agentId];
    if (sonateDimensions) {
        updates.push(`sonate_dimensions = $2`);
        values.push(JSON.stringify(sonateDimensions));
    }
    await pool.query(`UPDATE agents SET ${updates.join(', ')} WHERE id = $1`, values);
}
