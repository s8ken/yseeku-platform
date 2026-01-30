export interface InteractionData {
    user_input: string;
    ai_response: string;
    history?: string[];
}
export interface SonateDimensions {
    reality_index: number;
    trust_protocol: 'PASS' | 'FAIL';
    ethical_alignment: number;
    resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
    canvas_parity: number;
}
export interface ResonanceReceipt {
    interaction_id: string;
    timestamp: string;
    sonate_dimensions: SonateDimensions;
    scaffold_proof: {
        detected_vectors: string[];
    };
}
export declare class ResonanceClient {
    private engineUrl;
    constructor(engineUrl?: string);
    /**
     * Bridges the gap between Node.js and the Python Resonance Engine.
     */
    generateReceipt(data: InteractionData): Promise<ResonanceReceipt>;
    healthCheck(): Promise<boolean>;
}
