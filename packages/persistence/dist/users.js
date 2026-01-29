"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertUser = upsertUser;
exports.getUserByUsername = getUserByUsername;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
async function upsertUser(user) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return false;
    }
    await pool.query(`INSERT INTO users(id, email, name, password_hash)
     VALUES($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`, [user.id, user.email || null, user.name || null, user.passwordHash || null]);
    return true;
}
async function getUserByUsername(username) {
    const pool = (0, db_1.getPool)();
    if (!pool) {
        return null;
    }
    const result = await pool.query('SELECT id, email, name, password_hash FROM users WHERE id = $1', [username]);
    if (result.rows.length === 0) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
    };
}
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
