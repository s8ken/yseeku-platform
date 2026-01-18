import crypto from 'crypto';

describe('Ed25519 Crypto Tests', () => {
  let publicKey: crypto.KeyObject;
  let privateKey: crypto.KeyObject;

  test('Key Generation', () => {
    const { publicKey: pubKey, privateKey: privKey } = crypto.generateKeyPairSync('ed25519');
    publicKey = pubKey;
    privateKey = privKey;

    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
    const exportedPub = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    const exportedPriv = privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer;
    expect(Buffer.isBuffer(exportedPub)).toBe(true);
    expect(Buffer.isBuffer(exportedPriv)).toBe(true);
    expect(exportedPub.length).toBeGreaterThan(0);
    expect(exportedPriv.length).toBeGreaterThan(0);
  });

  test('Signing and Verification', () => {
    const message = 'Hello, world!';
    const signature = crypto.sign(null, Buffer.from(message, 'utf8'), privateKey);

    expect(signature).toBeDefined();
    expect(Buffer.isBuffer(signature)).toBe(true);
    expect(signature.length).toBeGreaterThan(0);
    expect(crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, signature)).toBe(true);

    const alteredMessage = 'Hello, world!!';
    expect(crypto.verify(null, Buffer.from(alteredMessage, 'utf8'), publicKey, signature)).toBe(
      false
    );
  });

  test('Key Uniqueness', () => {
    const keyPair1 = crypto.generateKeyPairSync('ed25519');
    const keyPair2 = crypto.generateKeyPairSync('ed25519');

    expect(
      (keyPair1.publicKey.export({ format: 'der', type: 'spki' }) as Buffer).toString('hex')
    ).not.toEqual(
      (keyPair2.publicKey.export({ format: 'der', type: 'spki' }) as Buffer).toString('hex')
    );
    expect(
      (keyPair1.privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer).toString('hex')
    ).not.toEqual(
      (keyPair2.privateKey.export({ format: 'der', type: 'pkcs8' }) as Buffer).toString('hex')
    );
  });

  test('Invalid Key Handling', async () => {
    const invalidKey = Buffer.alloc(16);
    const message = 'Test';

    expect(() => crypto.sign(null, Buffer.from(message, 'utf8'), invalidKey as any)).toThrow();
    expect(() =>
      crypto.verify(null, Buffer.from(message, 'utf8'), invalidKey as any, Buffer.alloc(64))
    ).toThrow();
  });

  test('Performance - Sub-100ms Signing', () => {
    crypto.generateKeyPairSync('ed25519');
    const start = Date.now();
    crypto.sign(null, Buffer.from('Performance test message', 'utf8'), privateKey);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
