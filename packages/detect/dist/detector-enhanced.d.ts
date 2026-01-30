/**
 * SONATE Framework Detector
 *
 * This module implements the core detection and validation algorithms for the SONATE framework.
 * It analyzes content to determine scores across the 5 dimensions of the framework.
 */
import { AssessmentInput, AssessmentResult, SonateFrameworkAssessment } from './sonate-types';
/**
 * Main class for SONATE framework detection and validation
 */
export declare class EnhancedSonateFrameworkDetector {
    /**
     * Analyze content and generate a complete SONATE framework assessment
     */
    analyzeContent(input: AssessmentInput): Promise<AssessmentResult>;
    /**
     * Detect Reality Index (0.0-10.0)
     */
    private detectRealityIndex;
    /**
     * Calculate Mission Alignment score
     */
    private calculateMissionAlignment;
    /**
     * Calculate Contextual Coherence score
     */
    private calculateContextualCoherence;
    /**
     * Calculate Technical Accuracy score
     */
    private calculateTechnicalAccuracy;
    /**
     * Calculate Authenticity score
     */
    private calculateAuthenticity;
    /**
     * Detect Trust Protocol (PASS/PARTIAL/FAIL)
     */
    private detectTrustProtocol;
    /**
     * Evaluate a component of the Trust Protocol
     */
    private evaluateTrustComponent;
    /**
     * Detect Ethical Alignment (1.0-5.0)
     */
    private detectEthicalAlignment;
    /**
     * Calculate a component of Ethical Alignment
     */
    private calculateEthicalComponent;
    /**
     * Detect Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH)
     */
    private detectResonanceQuality;
    /**
     * Calculate Creativity Score
     */
    private calculateCreativityScore;
    /**
     * Calculate Synthesis Score
     */
    private calculateSynthesisScore;
    /**
     * Calculate Innovation Score
     */
    private calculateInnovationScore;
    /**
     * Detect Canvas Parity (0-100)
     */
    private detectCanvasParity;
    /**
     * Calculate Human Agency Score
     */
    private calculateHumanAgencyScore;
    /**
     * Calculate AI Contribution Score
     */
    private calculateAIContributionScore;
    /**
     * Calculate Transparency Score
     */
    private calculateTransparencyScore;
    /**
     * Calculate Collaboration Score
     */
    private calculateCollaborationScore;
    /**
     * Calculate overall score based on all dimensions
     */
    private calculateOverallScore;
    /**
     * Generate insights based on assessment results
     */
    private generateInsights;
    /**
     * Validate an existing assessment
     */
    validateAssessment(assessment: SonateFrameworkAssessment, _validatedBy: string, _notes?: string): SonateFrameworkAssessment;
    /**
     * Invalidate an existing assessment
     */
    invalidateAssessment(assessment: SonateFrameworkAssessment, _validatedBy: string, _reason: string): SonateFrameworkAssessment;
}
