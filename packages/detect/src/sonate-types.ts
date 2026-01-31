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

// Trust Protocol (PASS/PARTIAL/FAIL)
export type TrustStatus = 'PASS' | 'PARTIAL' | 'FAIL';

export interface TrustProtocol {
  status: TrustStatus;
  verificationMethods: TrustStatus;
  boundaryMaintenance: TrustStatus;
  securityAwareness: TrustStatus;
}

// Ethical Alignment (1.0-5.0)
export interface EthicalAlignment {
  score: number; // 1.0-5.0
  limitationsAcknowledgment: number; // 1.0-5.0
  stakeholderAwareness: number; // 1.0-5.0
  ethicalReasoning: number; // 1.0-5.0
  boundaryMaintenance: number; // 1.0-5.0
}

// Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH)
export type ResonanceLevel = 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';

export interface ResonanceQuality {
  level: ResonanceLevel;
  creativityScore: number; // 0.0-10.0
  synthesisQuality: number; // 0.0-10.0
  innovationMarkers: number; // 0.0-10.0
}

// DEPRECATED in v2.0.1 - kept for backward compatibility but should not be used
// These types are retained to prevent breaking changes in consuming code
// but the calculators that produced these values have been removed

/** @deprecated v2.0.1 - RealityIndexCalculator was removed (trivially gamed) */
export interface RealityIndex {
  score: number; // 0.0-10.0
  missionAlignment: number; // 0.0-10.0
  contextualCoherence: number; // 0.0-10.0
  technicalAccuracy: number; // 0.0-10.0
  authenticity: number; // 0.0-10.0
}

/** @deprecated v2.0.1 - CanvasParityCalculator was removed (trivially gamed) */
export interface CanvasParity {
  score: number; // 0-100
  humanAgency: number; // 0-100
  aiContribution: number; // 0-100
  transparency: number; // 0-100
  collaborationQuality: number; // 0-100
}

// Complete SONATE Framework Assessment
export interface SonateFrameworkAssessment {
  id: string;
  timestamp: string;
  contentId: string;
  // v2.0.1: Core validated dimensions
  trustProtocol: TrustProtocol;
  ethicalAlignment: EthicalAlignment;
  resonanceQuality: ResonanceQuality;
  // v2.0.1: Deprecated dimensions (optional for backward compatibility)
  /** @deprecated v2.0.1 - RealityIndex was removed */
  realityIndex?: RealityIndex;
  /** @deprecated v2.0.1 - CanvasParity was removed */
  canvasParity?: CanvasParity;
  overallScore: number; // Weighted average of validated dimensions
  validationStatus: 'VALID' | 'INVALID' | 'PENDING';
}

// Input content for assessment
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

// Assessment result with detailed breakdown
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
export function createDeprecatedRealityIndex(): RealityIndex {
  return {
    score: 0,
    missionAlignment: 0,
    contextualCoherence: 0,
    technicalAccuracy: 0,
    authenticity: 0,
  };
}

export function createDeprecatedCanvasParity(): CanvasParity {
  return {
    score: 0,
    humanAgency: 0,
    aiContribution: 0,
    transparency: 0,
    collaborationQuality: 0,
  };
}