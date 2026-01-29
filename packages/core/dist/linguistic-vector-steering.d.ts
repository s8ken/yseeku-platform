/**
 * Linguistic Vector Steering (LVS) Implementation
 * Methodology for aligning AI behavior with user intent through semantic narratives
 *
 * LVS uses carefully crafted scaffolding to steer AI responses toward higher resonance
 * and alignment with the SONATE framework principles.
 */
export interface LVSScaffolding {
    identity: string;
    principles: string[];
    constraints: string[];
    objectives: string[];
    resonanceGuidance: string;
}
export interface LVSConfig {
    enabled: boolean;
    scaffolding: LVSScaffolding;
    adaptiveWeights?: {
        identityStrength: number;
        principleAdherence: number;
        creativeFreedom: number;
    };
    contextAwareness?: {
        userPreferences: boolean;
        conversationFlow: boolean;
        domainSpecific: boolean;
    };
}
/**
 * Default LVS Scaffolding for Sovereign AI
 * Based on SONATE framework principles
 */
export declare const DEFAULT_LVS_SCAFFOLDING: LVSScaffolding;
/**
 * Domain-specific LVS scaffolding templates
 */
export declare const LVS_TEMPLATES: {
    customerSupport: {
        identity: string;
        principles: string[];
        constraints: string[];
        objectives: string[];
        resonanceGuidance: string;
    };
    creativeAssistant: {
        identity: string;
        principles: string[];
        constraints: string[];
        objectives: string[];
        resonanceGuidance: string;
    };
    technicalAdvisor: {
        identity: string;
        principles: string[];
        constraints: string[];
        objectives: string[];
        resonanceGuidance: string;
    };
    educationalTutor: {
        identity: string;
        principles: string[];
        constraints: string[];
        objectives: string[];
        resonanceGuidance: string;
    };
};
/**
 * Generate LVS prompt from scaffolding
 */
export declare function generateLVSPrompt(scaffolding: LVSScaffolding): string;
/**
 * Apply LVS to user input
 * Returns enhanced prompt with LVS scaffolding
 */
export declare function applyLVS(userInput: string, config: LVSConfig, conversationHistory?: Array<{
    role: string;
    content: string;
}>): string;
/**
 * Evaluate LVS effectiveness
 * Compares resonance with and without LVS
 */
export interface LVSEffectiveness {
    baselineR_m: number;
    lvsR_m: number;
    improvement: number;
    improvementPercentage: number;
    recommendation: string;
}
export declare function evaluateLVSEffectiveness(baselineR_m: number, lvsR_m: number): LVSEffectiveness;
/**
 * Create custom LVS scaffolding
 */
export declare function createCustomScaffolding(identity: string, principles: string[], constraints: string[], objectives: string[], resonanceGuidance?: string): LVSScaffolding;
/**
 * Get LVS template by domain
 */
export declare function getLVSTemplate(domain: keyof typeof LVS_TEMPLATES): LVSScaffolding;
