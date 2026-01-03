// apps/web/src/app/api/trust/receipt/route.ts
import { NextResponse } from 'next/server';
import { resonanceWithStickiness, SessionState, Transcript } from '@sonate/detect';
import { canonicalTranscript, sha256Hex } from '@sonate/core';
import { getPool, ensureSchema } from '@/lib/db';

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
        const { transcript, session_id, tenant_id } = body;

        if (!transcript || !session_id) {
            return NextResponse.json({ error: "Missing transcript or session_id" }, { status: 400 });
        }

        // Load session state
        const session_state = await mockKV.get<SessionState>(`symbi:${session_id}`);

        const receipt = await resonanceWithStickiness(transcript as Transcript, session_state || undefined);

        // Canonicalize + sign
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
        
        if (canonicalInput.turns.length === 0) {
             canonicalInput.turns.push({
                 role: 'user',
                 ts_ms: Date.now(),
                 content: transcript.text,
                 model: 'unknown'
             });
        }

        const canonical = canonicalTranscript(canonicalInput);
        const selfHash = sha256Hex(canonical);
        const signature = await kmsSign(canonical);

        const signed_receipt = {
            ...receipt,
            receipt_id: selfHash,
            signature,
            session_state: receipt.session_state // For next call
        };

        // Persist to Database for Dashboard Visibility
        await ensureSchema();
        const pool = getPool();
        if (pool) {
            const ciq = {
                trust_score: Math.round(receipt.r_m * 100),
                symbi_dimensions: {
                    realityIndex: receipt.r_m * 10,
                    trustProtocol: receipt.r_m >= 0.7 ? 'PASS' : 'FAIL',
                    ethicalAlignment: receipt.r_m * 5,
                    resonanceQuality: receipt.r_m >= 0.9 ? 'BREAKTHROUGH' : receipt.r_m >= 0.8 ? 'ADVANCED' : 'STRONG',
                    canvasParity: Math.round(receipt.r_m * 100)
                }
            };

            await pool.query(
                `INSERT INTO trust_receipts (self_hash, session_id, version, timestamp, mode, ciq, signature, tenant_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (self_hash) DO NOTHING`,
                [
                    selfHash, 
                    session_id, 
                    '1.0', 
                    Date.now(), 
                    'demo', 
                    JSON.stringify(ciq), 
                    signature, 
                    tenant_id || 'default'
                ]
            );
            console.log(`✅ Saved trust receipt ${selfHash} to database.`);
        }

        // Store updated state with FIX: 30 days TTL (86400 * 30)
        if (signed_receipt.session_state) {
            await mockKV.set(`symbi:${session_id}`, signed_receipt.session_state, { ex: 86400 * 30 });
        }

        return NextResponse.json(signed_receipt);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
