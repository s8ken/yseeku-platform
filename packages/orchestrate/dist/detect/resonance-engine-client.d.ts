export interface ResonanceEngineClient {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    analyze(data: any): Promise<any>;
}
export declare function createResonanceEngineClient(): ResonanceEngineClient;
//# sourceMappingURL=resonance-engine-client.d.ts.map