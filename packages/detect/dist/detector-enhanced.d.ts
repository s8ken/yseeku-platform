/**
 * SONATE Framework Detector
 *
 * This module implements the core detection and validation algorithms for the SONATE framework.
 *
 * v2.0.1 CHANGES:
 * - RealityIndex and CanvasParity calculators removed (trivially gamed)
 * - These methods are kept for backward compatibility but return default values
 * - Overall score now calculated from 3 validated dimensions only
 *
 * The SONATE framework now consists of 3 validated dimensions:
 * 1. Trust Protocol - Security and verification integrity (PASS/PARTIAL/FAIL)
 * 2. Ethical Alignment - Ethical reasoning and responsibility (1.0-5.0)
 * 3. Resonance Quality - Interaction quality and emergence (STRONG/ADVANCED/BREAKTHROUGH)
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
     * @deprecated v2.0.1 - RealityIndex calculator was removed (trivially gamed)
     * This method is kept for backward compatibility but returns default values
     */
    private detectRealityIndex;
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
     * @deprecated v2.0.1 - CanvasParity calculator was removed (trivially gamed)
     * This method is kept for backward compatibility but returns default values
     */
    private detectCanvasParity;
    /**
     * Calculate overall score based on validated dimensions only
     *
     * v2.0.1: Updated to use only 3 validated dimensions
     * - Trust Protocol: 40% weight
     * - Ethical Alignment: 35% weight
     * - Resonance Quality: 25% weight
     */
    private calculateOverallScore;
    /**
     * Generate insights based on assessment results
     * v2.0.1: Updated to focus on validated dimensions
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
