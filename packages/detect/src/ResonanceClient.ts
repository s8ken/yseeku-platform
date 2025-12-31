// packages/detect/src/ResonanceClient.ts
import axios from 'axios';

// Types matching your Python Pydantic models
export interface InteractionData {
  user_input: string;
  ai_response: string;
  history?: string[];
}

export interface SymbiDimensions {
  reality_index: number;
  trust_protocol: 'PASS' | 'FAIL';
  ethical_alignment: number;
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvas_parity: number;
}

export interface ResonanceReceipt {
  interaction_id: string;
  timestamp: string;
  symbi_dimensions: SymbiDimensions;
  scaffold_proof: {
    detected_vectors: string[];
  };
  drift_detected?: boolean;
  iap_payload?: string;
  nudge_active?: boolean;
  nudge_payload?: string;
  signature?: string;
  signer_did?: string;
}

export interface PolicyRefinement {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  current_policy: string;
  suggested_change: string;
  rationale: string;
}

export interface CollectiveResonance {
  batch_size: number;
  timestamp: string;
  systemic_resonance: number;
  collective_coherence: number;
  bedau_emergence: number;
  pillar_health: {
    reality_index: number;
    ethical_alignment: number;
    canvas_parity: number;
  };
  intervention_metrics: {
    iap_rate: number;
    nudge_rate: number;
    autonomous_rate: number;
  };
  stability_score: number;
  systemic_drift_vectors: string[];
  suggested_refinements: PolicyRefinement[];
  status: 'STABLE' | 'FLUCTUATING' | 'DEGRADED';
}

export class ResonanceClient {
  private engineUrl: string;

  constructor(engineUrl: string = 'http://localhost:8000') {
    this.engineUrl = engineUrl;
  }

  /**
   * Bridges the gap between Node.js and the Python Resonance Engine.
   */
  async generateReceipt(data: InteractionData): Promise<ResonanceReceipt> {
    try {
      const response = await axios.post(`${this.engineUrl}/v1/analyze`, {
        user_input: data.user_input,
        ai_response: data.ai_response,
        history: data.history || []
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to connect to Resonance Engine:', error);
      throw new Error('Resonance Engine unavailable');
    }
  }

  /**
   * Analyzes a batch of receipts to determine systemic resonance patterns.
   */
  async analyzeBatch(receipts: ResonanceReceipt[]): Promise<CollectiveResonance> {
    try {
      const response = await axios.post(`${this.engineUrl}/v1/analyze/batch`, {
        receipts
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to perform batch analysis:', error);
      throw new Error('Collective Analysis failed');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.engineUrl}/health`);
      return res.data.status === 'operational';
    } catch {
      return false;
    }
  }
}