import Redis from 'ioredis';
export interface NonceStore {
    markUsed(nonce: string, ttlSeconds: number): Promise<void>;
    isUsed(nonce: string): Promise<boolean>;
}
export interface RevocationStore {
    revoke(id: string, reason?: string, ttlSeconds?: number): Promise<void>;
    isRevoked(id: string): Promise<boolean>;
}
export declare class RedisNonceStore implements NonceStore {
    private redis;
    constructor(redis: Redis);
    markUsed(nonce: string, ttlSeconds: number): Promise<void>;
    isUsed(nonce: string): Promise<boolean>;
}
export declare class RedisRevocationStore implements RevocationStore {
    private redis;
    constructor(redis: Redis);
    revoke(id: string, reason?: string, ttlSeconds?: number): Promise<void>;
    isRevoked(id: string): Promise<boolean>;
}
export declare class InMemoryNonceStore implements NonceStore {
    private nonces;
    markUsed(nonce: string, ttlSeconds: number): Promise<void>;
    isUsed(nonce: string): Promise<boolean>;
}
export declare class InMemoryRevocationStore implements RevocationStore {
    private revocations;
    revoke(id: string): Promise<void>;
    isRevoked(id: string): Promise<boolean>;
}
export declare function createNonceStore(redisUrl?: string): NonceStore;
export declare function createRevocationStore(redisUrl?: string): RevocationStore;
