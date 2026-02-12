import { NextResponse } from 'next/server';

import { resonanceWithStickiness, SessionState, Transcript } from '@/lib/detect-local';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';

// Mock KV Store (Shared with trust receipt route for demo)
const globalKv = globalThis as unknown as { mockKv: Map<string, { value: any, expiry: number }> };
if (!globalKv.mockKv) {
    globalKv.mockKv = new Map();
}

const mockKV = {
    get: <T>(key: string): Promise<T | null> => {
        const item = globalKv.mockKv.get(key);
        if (!item) {
            return Promise.resolve(null);
        }
        if (Date.now() > item.expiry) {
            globalKv.mockKv.delete(key);
            return Promise.resolve(null);
        }
        return Promise.resolve(item.value as T);
    },
    set: (key: string, value: unknown, options: { ex: number }): Promise<void> => {
        globalKv.mockKv.set(key, { value, expiry: Date.now() + options.ex * 1000 });
        return Promise.resolve();
    }
};

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { userInput, aiResponse, history, session_id } = body;

        let backendEvaluation: any = null;
        try {
            const resp = await fetch(`${BACKEND_URL}/api/trust/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: aiResponse,
                    previousMessages: Array.isArray(history) ? history : [],
                    sessionId: session_id || `lab-${Date.now()}`,
                }),
                cache: 'no-store'
            });
            if (resp.ok) {
                const json = await resp.json();
                backendEvaluation = json?.data?.evaluation || null;
            }
        } catch (_) {
            backendEvaluation = null;
        }

        // 2. Construct Transcript for TS Library (Stickiness & Explainability)
        const transcript: Transcript = {
            text: aiResponse || "",
            metadata: {
                userInput,
                historyCount: Array.isArray(history) ? history.length : 0,
                model: body.model || 'unknown'
            }
        };

        if (Array.isArray(history)) {
            transcript.turns = history.map((h: any) => ({
                role: h.role,
                content: h.content
            }));
            transcript.turns.push({ role: 'assistant', content: aiResponse });
        }

        const sessionId = session_id || 'demo-session';
        const sessionState = await mockKV.get<SessionState>(`sonate:${sessionId}`);

        // 3. Calculate Resonance with Stickiness
        const result = await resonanceWithStickiness(transcript, sessionState || undefined);

        // 4. Merge Backend trust evaluation if available
        if (backendEvaluation) {
            const backendRm = Math.max(0, Math.min(1, backendEvaluation.trustScore?.overall ?? result.r_m));
            result.r_m = (result.r_m * 0.4) + (backendRm * 0.6);
            result.audit_trail.push(`Backend Trust Evaluation merged: ${backendRm.toFixed(3)} (Weighted 60%)`);
        }

        // Store new state (30 days TTL)
        if (result.session_state) {
            await mockKV.set(`sonate:${sessionId}`, result.session_state, { ex: 86400 * 30 });
        }

        const explainableResult = {
            ...result,
            explanation: {
                stakes: result.stakes,
                stickiness: {
                    weight: result.stickiness_weight,
                    decayed_from: result.decayed_from,
                    history_turns: result.session_state?.decay_turns
                },
                adversarial: result.adversarial,
                componentBreakdown: result.breakdown,
                audit_trail: result.audit_trail,
                engine_source: backendEvaluation ? 'hybrid (Backend + TS)' : 'local (TS)'
            }
        };

        return NextResponse.json(explainableResult);
    } catch (e: any) {
        console.error("Explain API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
