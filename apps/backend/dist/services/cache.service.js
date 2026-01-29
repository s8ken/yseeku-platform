"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
const ioredis_1 = __importDefault(require("ioredis"));
const url = process.env.REDIS_URL || '';
const redis = url ? new ioredis_1.default(url) : null;
async function cacheGet(key) {
    if (!redis)
        return null;
    const raw = await redis.get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function cacheSet(key, value, ttlSeconds = 300) {
    if (!redis)
        return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
