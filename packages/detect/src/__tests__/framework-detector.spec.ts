import { SonateFrameworkDetector } from '../framework-detector';
import { AIInteraction } from '../index';

describe('SonateFrameworkDetector (base)', () => {
  test('detect returns 5D metrics and receipt hash', async () => {
    const det = new SonateFrameworkDetector();
    const interaction: AIInteraction = {
      content:
        'Mission: verify and validate boundaries with secure, ethical practices.\n- clear steps\n- transparent reasoning',
      context: 'unit-spec',
      metadata: { session_id: 'spec-session-1' },
    };
    const res = await det.detect(interaction);
    expect(typeof res.reality_index).toBe('number');
    expect(['PASS', 'PARTIAL', 'FAIL']).toContain(res.trust_protocol);
    expect(typeof res.ethical_alignment).toBe('number');
    expect(['STRONG', 'ADVANCED', 'BREAKTHROUGH']).toContain(res.resonance_quality);
    expect(typeof res.canvas_parity).toBe('number');
    expect(typeof res.timestamp).toBe('number');
    expect(typeof res.receipt_hash).toBe('string');
    expect(res.receipt_hash.length).toBeGreaterThan(0);
  });
});
