import { TrustReceipt } from '../receipts/trust-receipt';

describe('TrustReceipt regression hardening', () => {
  function makeReceipt(session_id = 'session-1') {
    return new TrustReceipt({
      version: '2.0.0',
      session_id,
      timestamp: 1700000000000,
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
      previous_hash: 'GENESIS',
    });
  }

  it('verify() returns false when no signature is present', async () => {
    const receipt = makeReceipt('session-1');
    const dummyPublicKey = new Uint8Array(32);
    await expect(receipt.verify(dummyPublicKey)).resolves.toBe(false);
  });

  it('verify() returns false when self_hash has been tampered after construction', async () => {
    const receipt = makeReceipt('session-2');
    // Simulate post-construction hash tampering (P0 regression)
    (receipt as unknown as Record<string, unknown>).self_hash = 'f'.repeat(64);
    const dummyPublicKey = new Uint8Array(32);
    await expect(receipt.verify(dummyPublicKey)).resolves.toBe(false);
  });

  it('deep-freezes nested payload objects to prevent in-process mutation', () => {
    const receipt = new TrustReceipt({
      version: '2.0.0',
      session_id: 'session-2',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.8, quality: 0.7 },
      previous_hash: 'GENESIS',
    });

    expect(Object.isFrozen(receipt.ciq_metrics)).toBe(true);
    expect(() => {
      Object.assign(receipt.ciq_metrics as object, { clarity: 0 });
    }).toThrow();
  });

  it('rejects fromJSON when self_hash does not match payload', () => {
    const serialized = {
      version: '2.0.0',
      session_id: 'session-3',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.8, quality: 0.7 },
      previous_hash: 'GENESIS',
      self_hash: 'f'.repeat(64),
      signature: '',
    };

    expect(() => TrustReceipt.fromJSON(serialized)).toThrow(
      'Invalid serialized receipt: self_hash does not match payload'
    );
  });
});
