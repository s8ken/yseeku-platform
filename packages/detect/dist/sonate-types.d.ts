/**
 * SONATE Framework Types
 *
 * This file defines the core types for the SONATE framework detection and validation system.
 * The SONATE framework consists of 5 dimensions for assessing AI collaboration artifacts:
 * 1. Reality Index - Grounding and factual coherence (0.0-10.0)
 * 2. Constitutional AI - Alignment with constitutional principles (0.0-10.0)
 * 3. Ethical Alignment - Ethical reasoning and responsibility (1.0-5.0)
 * 4. Trust Protocol - Security and verification integrity (PASS/PARTIAL/FAIL)
 * 5. Emergence Detection - Weak emergence monitoring and detection (0.0-10.0)
 */
export interface RealityIndex {
    score: number;
    missionAlignment: number;
    contextualCoherence: number;
    technicalAccuracy: number;
    authenticity: number;
}
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
    realityIndex: RealityIndex;
    trustProtocol: TrustProtocol;
    ethicalAlignment: EthicalAlignment;
    resonanceQuality: ResonanceQuality;
    canvasParity: CanvasParity;
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
