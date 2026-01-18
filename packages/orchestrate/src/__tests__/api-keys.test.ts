import { APIKeyManager, getAPIKeyManager } from '../security/api-keys';

describe('APIKeyManager', () => {
  let mgr: APIKeyManager;

  beforeEach(() => {
    mgr = getAPIKeyManager();
  });

  test('should generate, validate, and revoke API keys', async () => {
    const { key, rawKey } = await mgr.generateKey('user-1', 'test-key', { scopes: ['read'] });

    const validation = await mgr.validateKey(rawKey);
    expect(validation.valid).toBe(true);

    const revoked = await mgr.revokeKey(key.id, 'user-1');
    expect(revoked).toBe(true);

    const badValidation = await mgr.validateKey(rawKey);
    expect(badValidation.valid).toBe(false);
  });
});
