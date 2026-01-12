// apps/web/src/app/api/trust/receipt/route.ts
import { NextResponse } from 'next/server';
import { resonanceWithStickiness, SessionState, Transcript } from '@sonate/detect';
import { canonicalTranscript, sha256Hex, TrustReceipt } from '@sonate/core';
import { getPool, ensureSchema } from '@/lib/db';
import { kv } from '@/lib/kv';
import { createSecretsManager } from '@sonate/orchestrate';

function hexToUint8Array(hex: string): Uint8Array {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
}

async function getSigningKey(): Promise<Uint8Array | null> {
    try {
        if (process.env.SECRETS_PROVIDER === 'vault' && process.env.TRUST_SIGNING_PRIVATE_KEY_REF) {
            const sm = createSecretsManager();
            const ref = process.env.TRUST_SIGNING_PRIVATE_KEY_REF as string;
            const hex = await sm.decrypt(ref);
            if (hex && typeof hex === 'string') {
                return hexToUint8Array(hex);
            }
        }
        const privHex = process.env.TRUST_ED25519_PRIVATE_KEY_HEX || '';
        if (privHex) return hexToUint8Array(privHex);
        return null;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transcript, session_id, tenant_id } = body;

        if (!transcript || !session_id) {
            return NextResponse.json({ error: "Missing transcript or session_id" }, { status: 400 });
        }

        const session_state = await kv.get<SessionState>(`symbi:${session_id}`);

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
        const pool = getPool();
        await ensureSchema();
        let previousHash: string | undefined = undefined;
        if (pool) {
            const prev = await pool.query(
                `SELECT self_hash FROM trust_receipts WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [session_id]
            );
            if (prev.rows.length > 0) {
                previousHash = prev.rows[0].self_hash;
            }
        }

        const ciq_metrics = {
            clarity: Math.min(1, Math.max(0, receipt.r_m)),
            integrity: Math.min(1, Math.max(0, receipt.r_m)),
            quality: Math.min(1, Math.max(0, receipt.r_m))
        };

        const tr = new TrustReceipt({
            version: '1.0',
            session_id,
            timestamp: Date.now(),
            mode: 'constitutional',
            ciq_metrics,
            previous_hash: previousHash
        });

        const key = await getSigningKey();
        if (key) {
            await tr.signBound(key);
        } else {
            tr.signature = 'MOCK_SIG_BASE64_' + sha256Hex(Buffer.from(canonical)).slice(0, 10);
        }

        const signed_receipt = {
            ...receipt,
            receipt_id: tr.self_hash,
            signature: tr.signature,
            session_state: receipt.session_state // For next call
        };

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
                `INSERT INTO trust_receipts (self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, tenant_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (self_hash) DO NOTHING`,
                [
                    tr.self_hash,
                    session_id,
                    tr.version,
                    tr.timestamp,
                    tr.mode,
                    JSON.stringify(ciq),
                    previousHash || null,
                    tr.signature,
                    tenant_id || 'default'
                ]
            );
            console.log(`✅ Saved trust receipt ${tr.self_hash} to database.`);
        }

        if (signed_receipt.session_state) {
            await kv.set(`symbi:${session_id}`, signed_receipt.session_state, { ex: 86400 * 30 });
        }

        return NextResponse.json(signed_receipt);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
