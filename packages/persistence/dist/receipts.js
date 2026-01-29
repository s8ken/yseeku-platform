"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTrustReceipt = saveTrustReceipt;
exports.getReceiptsBySession = getReceiptsBySession;
exports.deleteTrustReceipt = deleteTrustReceipt;
exports.getAggregateMetrics = getAggregateMetrics;
const core_1 = require("@sonate/core");
const db_1 = require("./db");
async function saveTrustReceipt(receipt, tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return false;
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    await pool.query(`INSERT INTO trust_receipts(self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (self_hash) DO NOTHING`, [
        receipt.self_hash,
        receipt.session_id,
        receipt.version,
        receipt.timestamp,
        receipt.mode,
        JSON.stringify(receipt.ciq_metrics),
        receipt.previous_hash || null,
        receipt.signature || null,
        receipt.session_nonce || null,
        tid,
    ]);
    return true;
}
async function getReceiptsBySession(sessionId, tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return [];
    }
    // Validate sessionId format (UUID v4) to prevent injection/malformed queries
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId) &&
        !/^[0-9a-f]{32}$/i.test(sessionId)) {
        throw new Error('Invalid session_id format');
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    const res = await pool.query(`SELECT version, session_id, timestamp, mode, ciq, previous_hash, self_hash, signature, session_nonce FROM trust_receipts WHERE session_id = $1 AND (tenant_id = $2 OR $2 IS NULL) ORDER BY timestamp ASC`, [sessionId, tid]);
    return res.rows.map((row) => {
        const r = core_1.TrustReceipt.fromJSON({
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
async function deleteTrustReceipt(id, tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return false;
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    const res = await pool.query(`DELETE FROM trust_receipts WHERE self_hash = $1 AND (tenant_id = $2 OR $2 IS NULL)`, [id, tid]);
    return (res.rowCount ?? 0) > 0;
}
async function getAggregateMetrics(tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return [];
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    const res = await pool.query(`SELECT ciq, timestamp FROM trust_receipts WHERE (tenant_id = $1 OR $1 IS NULL)`, [tid]);
    return res.rows;
}
