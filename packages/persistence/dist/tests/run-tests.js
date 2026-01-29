"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@sonate/core");
const db_1 = require("../db");
const receipts_1 = require("../receipts");
async function main() {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        console.log('SKIP: No DATABASE_URL, persistence tests skipped');
        return;
    }
    await (0, db_1.ensureSchema)();
    const receipt = new core_1.TrustReceipt({
        version: '1.0',
        session_id: 'test-session',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
    });
    await (0, receipts_1.saveTrustReceipt)(receipt);
    const rows = await (0, receipts_1.getReceiptsBySession)('test-session');
    console.log('OK: Persisted receipts', rows.length);
}
main().catch((err) => {
    console.error('Persistence test error', err);
    process.exit(1);
});
