import { ResonanceLevel, ResonanceQuality } from './symbi-types';

export interface ResonanceMetrics {
  R_m: number;
  status: string;
  components: {
    vector_alignment: number;
    context_continuity: number;
    semantic_mirroring: number;
    ethical_awareness: number;
    entropy_penalty: number;
  };
  linguistic_vectors_active: string[];
  dominant_persona: string;
  persona_confidence: number;
}

export interface ResonanceResult {
  interaction_id: string;
  timestamp: string;
  resonance_metrics: ResonanceMetrics;
  user_input_hash: string;
  ai_response_hash: string;
  signature: string;
}

export class ResonanceEngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000';
  }

  async calculateResonance(
    userInput: string,
    aiResponse: string,
    conversationHistory: string[] = [],
    interactionId: string = 'unknown'
  ): Promise<ResonanceResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/calculate_resonance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userInput,
          ai_response: aiResponse,
          conversation_history: conversationHistory,
          interaction_id: interactionId,
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as ResonanceResult;
    } catch (error) {
      return null;
    }
  }

  async detectDrift(conversationScores: number[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/detect_drift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_scores: conversationScores,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json() as { drift_detected: boolean };
      return data.drift_detected;
    } catch (error) {
      return false;
    }
  }

  // Convert Python resonance result to TypeScript ResonanceQuality type
  static toResonanceQuality(result: ResonanceResult): ResonanceQuality {
    const score = result.resonance_metrics.R_m;
    let level: ResonanceLevel = 'STRONG';
    
    if (score >= 0.85) {
      level = 'BREAKTHROUGH';
    } else if (score >= 0.70) {
      level = 'ADVANCED';
    }

    return {
      level,
      creativityScore: result.resonance_metrics.components.semantic_mirroring * 10,
      synthesisQuality: result.resonance_metrics.components.context_continuity * 10,
      innovationMarkers: result.resonance_metrics.components.vector_alignment * 10,
    };
  }
}
