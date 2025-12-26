// packages/core/src/canonicalize.ts
import { createHash, createSign } from 'crypto';

export type Turn = { 
  role: 'user' | 'assistant' | 'system'; 
  ts_ms: number; 
  model?: string; 
  content: string; 
};

export type TranscriptCanonical = {
  session_id: string;
  created_ms: number;
  model: { name: string; revision?: string };
  derived?: Record<string, string>;
  turns: Turn[];
};

function normalizeText(s: string): string {
  // 1. Unicode NFC
  let out = s.normalize('NFC');
  // 2. Normalize line endings to LF
  out = out.replace(/\r\n?/g, '\n');
  // 3. Remove control chars except LF
  // eslint-disable-next-line no-control-regex
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  // 4. Replace smart quotes/dashes
  out = out.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-');
  // 5. Collapse whitespace to single space, preserve single \n
  // Split by newline, normalize whitespace in each line, then join back
  out = out.split('\n').map(p => p.replace(/\s+/g, ' ').trim()).join('\n');
  // 6. Trim final string
  return out.trim();
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj && typeof obj === 'object') {
    const sorted: any = {};
    Object.keys(obj).sort().forEach(k => {
      const v = obj[k];
      if (v === null || v === undefined) return; // omit nulls/undefined
      sorted[k] = sortObjectKeys(v);
    });
    return sorted;
  }
  return obj;
}

export function canonicalTranscript(transcript: TranscriptCanonical): Buffer {
  // Normalize each turn content
  const normalizedTurns = transcript.turns.map(t => ({
    role: t.role,
    ts_ms: Math.floor(t.ts_ms),
    model: t.model || '',
    content: normalizeText(t.content)
  }));

  const canonicalObj = {
    session_id: String(transcript.session_id),
    created_ms: Math.floor(transcript.created_ms),
    model: {
      name: transcript.model.name,
      revision: transcript.model.revision || ''
    },
    derived: transcript.derived || {},
    turns: normalizedTurns
  };

  const sorted = sortObjectKeys(canonicalObj);
  // Deterministic JSON: no spaces, sorted keys
  const json = JSON.stringify(sorted);
  return Buffer.from(json, 'utf8');
}

export function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// Example signing wrapper (uses Node crypto with ECDSA P-256, replace with KMS-based)
export function signBufferP256(buf: Buffer, privateKeyPem: string): string {
  const sign = createSign('sha256');
  sign.update(buf);
  sign.end();
  const sig = sign.sign(privateKeyPem); // DER by default
  return sig.toString('base64');
}
