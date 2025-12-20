// packages/core/src/__tests__/parity.spec.ts
import { canonicalTranscript } from '../canonicalize';

describe('Parity Check', () => {
  it('should match Python expected output', () => {
    const simple = {
      session_id: 's1', 
      created_ms: 100, 
      model: { name: 'm1' }, 
      turns: []
    };
    // @ts-ignore
    const buf = canonicalTranscript(simple);
    const s = buf.toString('utf8');
    const expected = '{"created_ms":100,"derived":{},"model":{"name":"m1","revision":""},"session_id":"s1","turns":[]}';
    expect(s).toBe(expected);
  });
});
