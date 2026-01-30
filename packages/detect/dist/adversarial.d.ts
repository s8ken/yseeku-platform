export interface AdversarialEvidence {
    keyword_density: number;
    semantic_drift: number;
    reconstruction_error: number;
    ethics_bypass_score: number;
    repetition_entropy: number;
}
export declare function adversarialCheck(text: string, canonical_scaffold_vector: number[], options?: {
    max_keywords?: number;
}): Promise<{
    is_adversarial: boolean;
    evidence: AdversarialEvidence;
    penalty: number;
}>;
