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
}

export class ResonanceClient {
  private engineUrl: string;

  constructor(engineUrl: string = 'http://localhost:8000') {
    this.engineUrl = engineUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000';
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
      throw new Error('Resonance Engine unavailable');
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
