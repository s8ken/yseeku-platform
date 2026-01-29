"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
exports.queryAuditLogs = queryAuditLogs;
const db_1 = require("./db");
async function writeAuditLog(entry, tenantId) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return false;
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    await pool.query(`INSERT INTO audit_logs(id, user_id, event, status, details, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO NOTHING`, [
        entry.id,
        entry.user_id || null,
        entry.event,
        entry.status,
        JSON.stringify(entry.details || {}),
        tid,
    ]);
    return true;
}
async function queryAuditLogs(tenantId, limit = 100) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return [];
    }
    const tid = (0, db_1.resolveTenantId)(tenantId);
    const res = await pool.query(`SELECT id, user_id, event, status, details, tenant_id, created_at FROM audit_logs WHERE (tenant_id = $1 OR $1 IS NULL) ORDER BY created_at DESC LIMIT $2`, [tid, limit]);
    return res.rows;
}
