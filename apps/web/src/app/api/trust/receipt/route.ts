// apps/web/src/app/api/trust/receipt/route.ts
import { NextResponse } from 'next/server';
import { resonanceWithStickiness, SessionState, Transcript } from '@sonate/detect';
import { canonicalTranscript, sha256Hex } from '@sonate/core';

// Mock KV Store (In-memory for demo)
// In production, use @vercel/kv or Redis
const kv = new Map<string, { value: any, expiry: number }>();

const mockKV = {
    get: async <T>(key: string): Promise<T | null> => {
        const item = kv.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            kv.delete(key);
            return null;
        }
        return item.value as T;
    },
    set: async (key: string, value: any, options: { ex: number }) => {
        kv.set(key, { value, expiry: Date.now() + options.ex * 1000 });
    }
};

// Mock KMS Sign
const kmsSign = async (buf: Buffer) => "MOCK_SIG_BASE64_" + sha256Hex(buf).slice(0, 10);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transcript, session_id } = body;

        if (!transcript || !session_id) {
            return NextResponse.json({ error: "Missing transcript or session_id" }, { status: 400 });
        }

        // Validate session_id format (UUID v4 or hex string) to prevent injection
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session_id) && 
            !/^[0-9a-f]{32}$/i.test(session_id)) {
            return NextResponse.json({ error: "Invalid session_id format" }, { status: 400 });
        }

        // Load session state
        const session_state = await mockKV.get<SessionState>(`symbi:${session_id}`);

        const receipt = await resonanceWithStickiness(transcript as Transcript, session_state || undefined);

        // Canonicalize + sign
        // Need to convert to CanonicalTranscript format. 
        // Assuming input transcript has 'turns' array. If not, we wrap it.
        const canonicalInput = {
            session_id,
            created_ms: Date.now(),
            model: { name: transcript.metadata?.model || 'unknown' },
            derived: { 
                rm: receipt.r_m.toFixed(4), 
                stakes: receipt.stakes.level 
            },
            turns: (transcript.turns || []).map((t: any) => ({
                role: t.role,
                ts_ms: t.ts_ms || Date.now(),
                content: t.content || t.text,
                model: t.model
            }))
        };
        
        // If transcript.turns is missing (simple text input), create a single turn
        if (canonicalInput.turns.length === 0) {
             canonicalInput.turns.push({
                 role: 'user',
                 ts_ms: Date.now(),
                 content: transcript.text,
                 model: 'unknown'
             });
        }

        const canonical = canonicalTranscript(canonicalInput);

        const signed_receipt = {
            ...receipt,
            receipt_id: sha256Hex(canonical),
            signature: await kmsSign(canonical),
            session_state: receipt.session_state // For next call
        };

        // Store updated state with FIX: 30 days TTL (86400 * 30)
        // Original issue was TTL too short (3600s)
        if (signed_receipt.session_state) {
            await mockKV.set(`symbi:${session_id}`, signed_receipt.session_state, { ex: 86400 * 30 });
        }

        return NextResponse.json(signed_receipt);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
