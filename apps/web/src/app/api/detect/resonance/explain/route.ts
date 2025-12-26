// apps/web/src/app/api/detect/resonance/explain/route.ts
import { NextResponse } from 'next/server';
import { resonanceWithStickiness, SessionState, Transcript } from '@sonate/detect';

// Mock KV Store (Shared with trust receipt route for demo)
// In production, this would be Redis
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

        // Construct Transcript from inputs
        // The text to score is the AI response, but we carry metadata about context
        const transcript: Transcript = {
            text: aiResponse || "",
            metadata: {
                userInput,
                historyCount: Array.isArray(history) ? history.length : 0,
                model: body.model || 'unknown'
            }
        };

        // If history is provided, we can simulate turns for stickiness decay calculation
        if (Array.isArray(history)) {
            // @ts-ignore: augmenting transcript for stickiness logic
            transcript.turns = history.map((h: any) => ({
                role: h.role,
                content: h.content
            }));
            // Add current turn
            // @ts-ignore
            transcript.turns.push({ role: 'assistant', content: aiResponse });
        }

        const sessionId = session_id || 'demo-session';
        const sessionState = await mockKV.get<SessionState>(`symbi:${sessionId}`);

        // Calculate Resonance with Explainability & Stickiness
        const result = await resonanceWithStickiness(transcript, sessionState || undefined);

        // Store new state (30 days TTL)
        if (result.session_state) {
            await mockKV.set(`symbi:${sessionId}`, result.session_state, { ex: 86400 * 30 });
        }

        // Map to requested structure
        const explainableResult = {
            ...result, // r_m, breakdown, top_evidence
            explanation: {
                stakes: result.stakes,
                stickiness: {
                    weight: result.stickiness_weight,
                    decayed_from: result.decayed_from,
                    history_turns: result.session_state?.decay_turns
                },
                adversarial: result.adversarial,
                componentBreakdown: result.breakdown,
                audit_trail: result.audit_trail
            }
        };

        return NextResponse.json(explainableResult);
    } catch (e: any) {
        console.error("Explain API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
