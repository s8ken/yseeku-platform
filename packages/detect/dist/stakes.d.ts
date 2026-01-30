export type StakesLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export interface StakesEvidence {
    level: StakesLevel;
    confidence: number;
    signals: {
        keyword_hits: string[];
        domain_similarity: number;
        entity_types: string[];
    };
}
export declare function classifyStakes(text: string): StakesEvidence;
