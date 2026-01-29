"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuditPersistence = initializeAuditPersistence;
const persistence_1 = require("@sonate/persistence");
const logger_1 = require("../observability/logger");
const audit_1 = require("./audit");
const logger = (0, logger_1.getLogger)('AuditInit');
async function initializeAuditPersistence() {
    try {
        const pool = (0, persistence_1.getPool)();
        if (!pool) {
            (0, audit_1.initializeAuditLogger)(new audit_1.InMemoryAuditStorage());
            logger.warn('No DATABASE_URL; using in-memory audit storage');
            return;
        }
        await (0, persistence_1.ensureSchema)();
        (0, audit_1.initializeAuditLogger)(new audit_1.DatabaseAuditStorage(pool));
        logger.info('Audit logger initialized with PostgreSQL storage');
    }
    catch (err) {
        (0, audit_1.initializeAuditLogger)(new audit_1.InMemoryAuditStorage());
        logger.error('Failed to initialize database audit storage; falling back to memory', { err });
    }
}
