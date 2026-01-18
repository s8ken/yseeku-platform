// packages/core/src/__tests__/canonicalize.spec.ts
import { canonicalTranscript, sha256Hex, TranscriptCanonical } from '../canonicalize';

describe('Canonicalization', () => {
  const baseTranscript: TranscriptCanonical = {
    session_id: 'sess_123',
    created_ms: 1700000000000,
    model: { name: 'gpt-4', revision: 'v1' },
    derived: { seed: '123' },
    turns: [
      { role: 'user', ts_ms: 1700000001000, content: 'Hello   world' },
      { role: 'assistant', ts_ms: 1700000002000, content: '“Smart quotes” and — dashes' },
    ],
  };

  it('should be deterministic', () => {
    const buf1 = canonicalTranscript(baseTranscript);
    const buf2 = canonicalTranscript(JSON.parse(JSON.stringify(baseTranscript)));

    expect(sha256Hex(buf1)).toBe(sha256Hex(buf2));
    expect(buf1.toString('hex')).toBe(buf2.toString('hex'));
  });

  it('should normalize text', () => {
    const transcript = { ...baseTranscript };
    transcript.turns = [
      { role: 'user', ts_ms: 100, content: '  Too   many    spaces  ' },
      { role: 'assistant', ts_ms: 200, content: 'Line\r\nEndings\nFixed' },
    ];

    const buf = canonicalTranscript(transcript);
    const str = buf.toString('utf8');

    // Check for collapsed spaces and trimmed ends
    expect(str).toContain('"content":"Too many spaces"');
    // Check for normalized line endings (\\n in JSON string)
    expect(str).toContain('Line\\nEndings\\nFixed');
  });

  it('should sort keys', () => {
    // Create object with mixed key order
    const messyInput: any = {
      turns: [],
      derived: {},
      model: { revision: 'v1', name: 'gpt-4' }, // revision before name
      created_ms: 123,
      session_id: 'abc',
    };

    const buf = canonicalTranscript(messyInput);
    const str = buf.toString('utf8');

    // keys should be: created_ms, derived, model, session_id, turns
    const keysIndex = [
      str.indexOf('"created_ms"'),
      str.indexOf('"derived"'),
      str.indexOf('"model"'),
      str.indexOf('"session_id"'),
      str.indexOf('"turns"'),
    ];

    // Assert strictly increasing indices
    for (let i = 0; i < keysIndex.length - 1; i++) {
      expect(keysIndex[i]).toBeLessThan(keysIndex[i + 1]);
    }

    // Check nested model keys: name before revision
    const modelStr = str.match(/"model":\{.*?\}/)![0];
    expect(modelStr.indexOf('"name"')).toBeLessThan(modelStr.indexOf('"revision"'));
  });

  it('should omit null/undefined fields', () => {
    const input: any = {
      session_id: '123',
      created_ms: 1,
      model: { name: 'test' },
      turns: [],
      extra_null: null,
    };
    // @ts-ignore
    const buf = canonicalTranscript(input);
    const str = buf.toString('utf8');
    expect(str).not.toContain('"extra_null"');
  });
});
