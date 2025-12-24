import { InMemoryRateLimitStore, RateLimiter } from '../security/rate-limiter';

describe('RateLimiter', () => {
  test('should enforce rate limits', async () => {
    const store = new InMemoryRateLimitStore();
    const limiter = createRateLimiter(store);

    const r1 = await limiter.checkLimit({windowMs: 1000, maxRequests: 2, identifier: 'test', identifierType: 'ip'});
    const r2 = await limiter.checkLimit({windowMs: 1000, maxRequests: 2, identifier: 'test', identifierType: 'ip'});
    const r3 = await limiter.checkLimit({windowMs: 1000, maxRequests: 2, identifier: 'test', identifierType: 'ip'});

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
  });
});