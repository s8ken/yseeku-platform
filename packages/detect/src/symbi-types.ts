/**
 * SYMBI Framework Types
 * 
 * This file defines the core types for the SYMBI framework detection and validation system.
 * The SYMBI framework consists of 5 dimensions for assessing AI collaboration artifacts.
 */

// Reality Index (0.0-10.0)
export interface RealityIndex {
  score: number; // 0.0-10.0
  missionAlignment: number; // 0.0-10.0
  contextualCoherence: number; // 0.0-10.0
  technicalAccuracy: number; // 0.0-10.0
  authenticity: number; // 0.0-10.0
}

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

// Canvas Parity (0-100)
export interface CanvasParity {
  score: number; // 0-100
  humanAgency: number; // 0-100
  aiContribution: number; // 0-100
  transparency: number; // 0-100
  collaborationQuality: number; // 0-100
}

// Complete SYMBI Framework Assessment
export interface SymbiFrameworkAssessment {
  id: string;
  timestamp: string;
  contentId: string;
  realityIndex: RealityIndex;
  trustProtocol: TrustProtocol;
  ethicalAlignment: EthicalAlignment;
  resonanceQuality: ResonanceQuality;
  canvasParity: CanvasParity;
  overallScore: number; // Weighted average of all dimensions
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
  assessment: SymbiFrameworkAssessment;
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