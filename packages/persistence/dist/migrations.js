"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.getMigrationStatus = getMigrationStatus;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const db_1 = require("./db");
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
async function runMigrations() {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        throw new Error('Database pool not available');
    }
    // Create migrations table if not exists
    await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
    // Get applied migrations
    const appliedRes = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(appliedRes.rows.map((r) => r.version));
    // Get migration files
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const version = path.basename(file, '.sql').split('_')[0];
        if (appliedVersions.has(version)) {
            continue;
        }
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    }
}
async function getMigrationStatus() {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return [];
    }
    const res = await pool.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
    return res.rows.map((r) => ({ version: r.version, applied_at: r.applied_at }));
}
