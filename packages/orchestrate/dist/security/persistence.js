"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRevocationStore = exports.InMemoryNonceStore = exports.RedisRevocationStore = exports.RedisNonceStore = void 0;
exports.createNonceStore = createNonceStore;
exports.createRevocationStore = createRevocationStore;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisNonceStore {
    constructor(redis) {
        this.redis = redis;
    }
    async markUsed(nonce, ttlSeconds) {
        const key = `nonce:${nonce}`;
        const added = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
        if (!added) {
            throw new Error('Nonce already used');
        }
    }
    async isUsed(nonce) {
        const key = `nonce:${nonce}`;
        const exists = await this.redis.exists(key);
        return exists === 1;
    }
}
exports.RedisNonceStore = RedisNonceStore;
class RedisRevocationStore {
    constructor(redis) {
        this.redis = redis;
    }
    async revoke(id, reason = 'Revoked', ttlSeconds = 24 * 3600) {
        const key = `revoked:${id}`;
        await this.redis.set(key, reason, 'EX', ttlSeconds);
    }
    async isRevoked(id) {
        const key = `revoked:${id}`;
        const exists = await this.redis.exists(key);
        return exists === 1;
    }
}
exports.RedisRevocationStore = RedisRevocationStore;
class InMemoryNonceStore {
    constructor() {
        this.nonces = new Set();
    }
    async markUsed(nonce, ttlSeconds) {
        if (this.nonces.has(nonce)) {
            throw new Error('Nonce already used');
        }
        this.nonces.add(nonce);
        // Cleanup not implemented for simple in-memory
    }
    async isUsed(nonce) {
        return this.nonces.has(nonce);
    }
}
exports.InMemoryNonceStore = InMemoryNonceStore;
class InMemoryRevocationStore {
    constructor() {
        this.revocations = new Set();
    }
    async revoke(id) {
        this.revocations.add(id);
    }
    async isRevoked(id) {
        return this.revocations.has(id);
    }
}
exports.InMemoryRevocationStore = InMemoryRevocationStore;
// Factories
function createNonceStore(redisUrl) {
    if (redisUrl) {
        return new RedisNonceStore(new ioredis_1.default(redisUrl));
    }
    return new InMemoryNonceStore();
}
function createRevocationStore(redisUrl) {
    if (redisUrl) {
        return new RedisRevocationStore(new ioredis_1.default(redisUrl));
    }
    return new InMemoryRevocationStore();
}
