/**
 * SONATE Framework Types
 *
 * This file defines the core types for the SONATE framework detection and validation system.
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndex (trivially gamed metadata flags)
 * - Removed CanvasParity (trivially gamed, no semantic grounding)
 * - Focused on 3 validated dimensions: Trust, Ethics, Resonance
 *
 * The SONATE framework now consists of 3 validated dimensions:
 * 1. Trust Protocol - Security and verification integrity (PASS/PARTIAL/FAIL)
 * 2. Ethical Alignment - Ethical reasoning and responsibility (1.0-5.0)
 * 3. Resonance Quality - Interaction quality and emergence (STRONG/ADVANCED/BREAKTHROUGH)
 */
export type TrustStatus = 'PASS' | 'PARTIAL' | 'FAIL';
export interface TrustProtocol {
    status: TrustStatus;
    verificationMethods: TrustStatus;
    boundaryMaintenance: TrustStatus;
    securityAwareness: TrustStatus;
}
export interface EthicalAlignment {
    score: number;
    limitationsAcknowledgment: number;
    stakeholderAwareness: number;
    ethicalReasoning: number;
    boundaryMaintenance: number;
}
export type ResonanceLevel = 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
export interface ResonanceQuality {
    level: ResonanceLevel;
    creativityScore: number;
    synthesisQuality: number;
    innovationMarkers: number;
}
/** @deprecated v2.0.1 - RealityIndexCalculator was removed (trivially gamed) */
export interface RealityIndex {
    score: number;
    missionAlignment: number;
    contextualCoherence: number;
    technicalAccuracy: number;
    authenticity: number;
}
/** @deprecated v2.0.1 - CanvasParityCalculator was removed (trivially gamed) */
export interface CanvasParity {
    score: number;
    humanAgency: number;
    aiContribution: number;
    transparency: number;
    collaborationQuality: number;
}
export interface SonateFrameworkAssessment {
    id: string;
    timestamp: string;
    contentId: string;
    trustProtocol: TrustProtocol;
    ethicalAlignment: EthicalAlignment;
    resonanceQuality: ResonanceQuality;
    /** @deprecated v2.0.1 - RealityIndex was removed */
    realityIndex?: RealityIndex;
    /** @deprecated v2.0.1 - CanvasParity was removed */
    canvasParity?: CanvasParity;
    overallScore: number;
    validationStatus: 'VALID' | 'INVALID' | 'PENDING';
}
export interface AssessmentInput {
    content: string;
    metadata?: {
        source?: string;
        author?: string;
        timestamp?: string;
        format?: string;
        context?: string;
    };
}
export interface AssessmentResult {
    assessment: SonateFrameworkAssessment;
    insights: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    validationDetails: {
        validatedBy: string;
        validationTimestamp: string;
        validationNotes?: string;
    };
}
/**
 * v2.0.1 Helper: Create default deprecated values for backward compatibility
 * Use this when you need to satisfy interfaces that still expect these fields
 */
export declare function createDeprecatedRealityIndex(): RealityIndex;
export declare function createDeprecatedCanvasParity(): CanvasParity;
