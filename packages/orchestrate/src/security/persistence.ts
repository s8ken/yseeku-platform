import Redis from 'ioredis';

export interface NonceStore {
  markUsed(nonce: string, ttlSeconds: number): Promise<void>;
  isUsed(nonce: string): Promise<boolean>;
}

export interface RevocationStore {
  revoke(id: string, reason?: string, ttlSeconds?: number): Promise<void>;
  isRevoked(id: string): Promise<boolean>;
}

export class RedisNonceStore implements NonceStore {
  constructor(private redis: Redis) {}

  async markUsed(nonce: string, ttlSeconds: number): Promise<void> {
    const key = `nonce:${nonce}`;
    const added = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    if (!added) {
      throw new Error('Nonce already used');
    }
  }

  async isUsed(nonce: string): Promise<boolean> {
    const key = `nonce:${nonce}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}

export class RedisRevocationStore implements RevocationStore {
  constructor(private redis: Redis) {}

  async revoke(id: string, reason: string = 'Revoked', ttlSeconds: number = 24 * 3600): Promise<void> {
    const key = `revoked:${id}`;
    await this.redis.set(key, reason, 'EX', ttlSeconds);
  }

  async isRevoked(id: string): Promise<boolean> {
    const key = `revoked:${id}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}

export class InMemoryNonceStore implements NonceStore {
  private nonces = new Set<string>();

  async markUsed(nonce: string, ttlSeconds: number): Promise<void> {
    if (this.nonces.has(nonce)) {
      throw new Error('Nonce already used');
    }
    this.nonces.add(nonce);
    // Cleanup not implemented for simple in-memory
  }

  async isUsed(nonce: string): Promise<boolean> {
    return this.nonces.has(nonce);
  }
}

export class InMemoryRevocationStore implements RevocationStore {
  private revocations = new Set<string>();

  async revoke(id: string): Promise<void> {
    this.revocations.add(id);
  }

  async isRevoked(id: string): Promise<boolean> {
    return this.revocations.has(id);
  }
}

// Factories
export function createNonceStore(redisUrl?: string): NonceStore {
    if (redisUrl) {
        return new RedisNonceStore(new Redis(redisUrl));
    }
    return new InMemoryNonceStore();
}

export function createRevocationStore(redisUrl?: string): RevocationStore {
    if (redisUrl) {
        return new RedisRevocationStore(new Redis(redisUrl));
    }
    return new InMemoryRevocationStore();
}
