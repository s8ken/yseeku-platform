// apps/web/src/app/api/detect/resonance/explain/route.ts
import { NextResponse } from 'next/server';
import { resonanceWithStickiness, SessionState, Transcript, ResonanceClient } from '@sonate/detect';

// Initialize client for Python Sidecar (Optional fallback)
const resonanceClient = new ResonanceClient(process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000');

// Mock KV Store (Shared with trust receipt route for demo)
const globalKv = globalThis as unknown as { mockKv: Map<string, { value: any, expiry: number }> };
if (!globalKv.mockKv) {
    globalKv.mockKv = new Map();
}

const mockKV = {
    get: async <T>(key: string): Promise<T | null> => {
        const item = globalKv.mockKv.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            globalKv.mockKv.delete(key);
            return null;
        }
        return item.value as T;
    },
    set: async (key: string, value: any, options: { ex: number }) => {
        globalKv.mockKv.set(key, { value, expiry: Date.now() + options.ex * 1000 });
    }
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userInput, aiResponse, history, session_id } = body;

        // 1. Attempt to get "Ground Truth" from Python Resonance Engine if online
        let pythonReceipt = null;
        try {
            const isEngineOnline = await resonanceClient.healthCheck();
            if (isEngineOnline) {
                pythonReceipt = await resonanceClient.generateReceipt({
                    user_input: userInput,
                    ai_response: aiResponse,
                    history: history || []
                });
            }
        } catch (err) {
            pythonReceipt = null;
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
            // @ts-ignore
            transcript.turns = history.map((h: any) => ({
                role: h.role,
                content: h.content
            }));
            // @ts-ignore
            transcript.turns.push({ role: 'assistant', content: aiResponse });
        }

        const sessionId = session_id || 'demo-session';
        const sessionState = await mockKV.get<SessionState>(`symbi:${sessionId}`);

        // 3. Calculate Resonance with Stickiness
        const result = await resonanceWithStickiness(transcript, sessionState || undefined);

        // 4. Merge Python Engine results if available for "Multi-Engine" validation
        if (pythonReceipt) {
            // Adjust R_m based on Python engine's more sophisticated semantic analysis
            // We use a weighted average or replace if Python is considered "Ground Truth"
            const pythonRm = Math.max(0, Math.min(1, pythonReceipt.symbi_dimensions.reality_index / 10));
            result.r_m = (result.r_m * 0.4) + (pythonRm * 0.6); // 60% weight to Python Engine
            result.audit_trail.push(`Python Resonance Engine Validation: ${pythonRm.toFixed(3)} (Weighted 60%)`);
        }

        // Store new state (30 days TTL)
        if (result.session_state) {
            await mockKV.set(`symbi:${sessionId}`, result.session_state, { ex: 86400 * 30 });
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
                engine_source: pythonReceipt ? 'hybrid (Python + TS)' : 'local (TS)'
            }
        };

        return NextResponse.json(explainableResult);
    } catch (e: any) {
        console.error("Explain API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
