import { InMemoryRateLimitStore, RateLimiter } from '../security/rate-limiter';

describe('RateLimiter', () => {
  test('should enforce rate limits', async () => {
    const store = new InMemoryRateLimitStore({ windowMs: 1000, maxRequests: 2 });
    const limiter = new RateLimiter(store, { windowMs: 1000, maxRequests: 2 });

    const r1 = await limiter.checkLimit('ip:1');
    const r2 = await limiter.checkLimit('ip:1');
    const r3 = await limiter.checkLimit('ip:1');

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
  });
});