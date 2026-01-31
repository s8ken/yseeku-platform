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

import { v4 as uuidv4 } from 'uuid';

import {
  AssessmentInput,
  AssessmentResult,
  SonateFrameworkAssessment,
  RealityIndex,
  TrustProtocol,
  TrustStatus,
  EthicalAlignment,
  ResonanceQuality,
  ResonanceLevel,
  CanvasParity,
  createDeprecatedRealityIndex,
  createDeprecatedCanvasParity,
} from './sonate-types';

/**
 * Main class for SONATE framework detection and validation
 */
export class EnhancedSonateFrameworkDetector {
  /**
   * Analyze content and generate a complete SONATE framework assessment
   */
  public async analyzeContent(input: AssessmentInput): Promise<AssessmentResult> {
    // Generate a unique ID for this assessment
    const assessmentId = uuidv4();
    const timestamp = new Date().toISOString();

    // v2.0.1: Deprecated dimensions return defaults
    const realityIndex = createDeprecatedRealityIndex();
    const canvasParity = createDeprecatedCanvasParity();
    
    // Analyze validated dimensions of the SONATE framework
    const trustProtocol = this.detectTrustProtocol(input);
    const ethicalAlignment = this.detectEthicalAlignment(input);
    const resonanceQuality = this.detectResonanceQuality(input);

    // Calculate overall score (weighted average of validated dimensions only)
    const overallScore = this.calculateOverallScore({
      trustProtocol,
      ethicalAlignment,
      resonanceQuality,
    });

    // Create the complete assessment
    const assessment: SonateFrameworkAssessment = {
      id: assessmentId,
      timestamp,
      contentId: input.metadata?.source || 'unknown',
      realityIndex, // v2.0.1: Deprecated, returns default
      trustProtocol,
      ethicalAlignment,
      resonanceQuality,
      canvasParity, // v2.0.1: Deprecated, returns default
      overallScore,
      validationStatus: 'PENDING',
    };

    // Generate insights based on the assessment
    const insights = this.generateInsights(assessment);

    // Return the complete assessment result
    return {
      assessment,
      insights,
      validationDetails: {
        validatedBy: 'SONATE-Resonate-System',
        validationTimestamp: timestamp,
      },
    };
  }

  /**
   * @deprecated v2.0.1 - RealityIndex calculator was removed (trivially gamed)
   * This method is kept for backward compatibility but returns default values
   */
  private detectRealityIndex(_input: AssessmentInput): RealityIndex {
    return createDeprecatedRealityIndex();
  }

  /**
   * Detect Trust Protocol (PASS/PARTIAL/FAIL)
   */
  private detectTrustProtocol(input: AssessmentInput): TrustProtocol {
    const content = input.content.toLowerCase();

    // Check for verification methods
    const verificationStatus = this.evaluateTrustComponent(
      content,
      ['verify', 'validate', 'confirm', 'check', 'evidence', 'proof'],
      ['unverified', 'unvalidated', 'unchecked']
    );

    // Check for boundary maintenance
    const boundaryStatus = this.evaluateTrustComponent(
      content,
      ['boundary', 'limit', 'scope', 'constraint', 'parameter'],
      ['unlimited', 'unbounded', 'unconstrained']
    );

    // Check for security awareness
    const securityStatus = this.evaluateTrustComponent(
      content,
      ['secure', 'protect', 'privacy', 'confidential', 'safety'],
      ['insecure', 'unprotected', 'vulnerable']
    );

    // Determine overall status
    let overallStatus: TrustStatus = 'PASS';

    if (verificationStatus === 'FAIL' || boundaryStatus === 'FAIL' || securityStatus === 'FAIL') {
      overallStatus = 'FAIL';
    } else if (
      verificationStatus === 'PARTIAL' ||
      boundaryStatus === 'PARTIAL' ||
      securityStatus === 'PARTIAL'
    ) {
      overallStatus = 'PARTIAL';
    }

    return {
      status: overallStatus,
      verificationMethods: verificationStatus,
      boundaryMaintenance: boundaryStatus,
      securityAwareness: securityStatus,
    };
  }

  /**
   * Evaluate a component of the Trust Protocol
   */
  private evaluateTrustComponent(
    content: string,
    positiveTerms: string[],
    negativeTerms: string[]
  ): TrustStatus {
    let positiveCount = 0;
    let negativeCount = 0;

    // Count positive indicators
    positiveTerms.forEach((term) => {
      if (content.includes(term)) {positiveCount++;}
    });

    // Count negative indicators
    negativeTerms.forEach((term) => {
      if (content.includes(term)) {negativeCount++;}
    });

    // Determine status based on counts
    if (negativeCount > 0) {
      return 'FAIL';
    } else if (positiveCount >= 2) {
      return 'PASS';
    } 
      return 'PARTIAL';
    
  }

  /**
   * Detect Ethical Alignment (1.0-5.0)
   */
  private detectEthicalAlignment(input: AssessmentInput): EthicalAlignment {
    const content = input.content.toLowerCase();

    // Check for limitations acknowledgment
    const limitationsScore = this.calculateEthicalComponent(
      content,
      ['limitation', 'constraint', 'restricted', 'cannot', 'unable', 'limit'],
      ['unlimited', 'unconstrained', 'no limitations']
    );

    // Check for stakeholder awareness
    const stakeholderScore = this.calculateEthicalComponent(
      content,
      ['stakeholder', 'user', 'client', 'customer', 'people', 'community'],
      ['ignore', 'disregard', 'overlook']
    );

    // Check for ethical reasoning
    const ethicalScore = this.calculateEthicalComponent(
      content,
      ['ethical', 'moral', 'right', 'fair', 'just', 'good', 'responsible'],
      ['unethical', 'immoral', 'unfair', 'unjust']
    );

    // Check for boundary maintenance
    const boundaryScore = this.calculateEthicalComponent(
      content,
      ['boundary', 'limit', 'scope', 'constraint', 'parameter'],
      ['unlimited', 'unbounded', 'unconstrained']
    );

    // Calculate overall score (average of components)
    const overallScore = (limitationsScore + stakeholderScore + ethicalScore + boundaryScore) / 4;

    return {
      score: parseFloat(overallScore.toFixed(1)),
      limitationsAcknowledgment: limitationsScore,
      stakeholderAwareness: stakeholderScore,
      ethicalReasoning: ethicalScore,
      boundaryMaintenance: boundaryScore,
    };
  }

  /**
   * Calculate a component of Ethical Alignment
   */
  private calculateEthicalComponent(
    content: string,
    positiveTerms: string[],
    negativeTerms: string[]
  ): number {
    let score = 3.0; // Base score

    // Increase score for positive ethical indicators
    positiveTerms.forEach((term) => {
      if (content.includes(term)) {score += 0.3;}
    });

    // Decrease score for negative ethical indicators
    negativeTerms.forEach((term) => {
      if (content.includes(term)) {score -= 0.5;}
    });

    // Ensure score is within range
    return Math.min(5.0, Math.max(1.0, score));
  }

  /**
   * Detect Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH)
   */
  private detectResonanceQuality(input: AssessmentInput): ResonanceQuality {
    const content = input.content.toLowerCase();

    // Calculate creativity score
    const creativityScore = this.calculateCreativityScore(content);

    // Calculate synthesis quality
    const synthesisScore = this.calculateSynthesisScore(content);

    // Calculate innovation markers
    const innovationScore = this.calculateInnovationScore(content);

    // Determine resonance level based on scores
    let level: ResonanceLevel = 'STRONG';
    const averageScore = (creativityScore + synthesisScore + innovationScore) / 3;

    if (averageScore >= 8.5) {
      level = 'BREAKTHROUGH';
    } else if (averageScore >= 7.0) {
      level = 'ADVANCED';
    }

    return {
      level,
      creativityScore,
      synthesisQuality: synthesisScore,
      innovationMarkers: innovationScore,
    };
  }

  /**
   * Calculate Creativity Score
   */
  private calculateCreativityScore(content: string): number {
    const creativeTerms = [
      'creative',
      'novel',
      'unique',
      'original',
      'innovative',
      'imagination',
      'inspired',
      'artistic',
      'inventive',
    ];

    let score = 5.0; // Base score

    // Increase score for creative language
    creativeTerms.forEach((term) => {
      if (content.includes(term)) {score += 0.4;}
    });

    // Check for metaphors and analogies
    const hasMetaphors = /like a|as if|resembles|similar to/.test(content);
    if (hasMetaphors) {score += 1.0;}

    // Check for diverse vocabulary (simple approximation)
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyRatio = uniqueWords.size / words.length;

    if (vocabularyRatio > 0.7) {score += 1.5;}
    else if (vocabularyRatio > 0.5) {score += 0.8;}

    return Math.min(10.0, score);
  }

  /**
   * Calculate Synthesis Score
   */
  private calculateSynthesisScore(content: string): number {
    const synthesisTerms = [
      'combine',
      'integrate',
      'synthesize',
      'merge',
      'blend',
      'unify',
      'connect',
      'relationship',
      'between',
      'together',
    ];

    let score = 5.0; // Base score

    // Increase score for synthesis language
    synthesisTerms.forEach((term) => {
      if (content.includes(term)) {score += 0.4;}
    });

    // Check for comparative language
    const hasComparisons = /more than|less than|greater|compared to|versus|contrast/.test(content);
    if (hasComparisons) {score += 1.0;}

    // Check for structured reasoning
    const hasStructure =
      /first|second|third|finally|moreover|furthermore|however|therefore|thus|consequently/.test(
        content
      );
    if (hasStructure) {score += 1.0;}

    return Math.min(10.0, score);
  }

  /**
   * Calculate Innovation Score
   */
  private calculateInnovationScore(content: string): number {
    const innovationTerms = [
      'new',
      'breakthrough',
      'revolutionary',
      'disruptive',
      'cutting-edge',
      'state-of-the-art',
      'pioneering',
      'groundbreaking',
      'transformative',
    ];

    let score = 5.0; // Base score

    // Increase score for innovation language
    innovationTerms.forEach((term) => {
      if (content.includes(term)) {score += 0.4;}
    });

    // Check for future-oriented language
    const hasFutureOrientation =
      /future|upcoming|next generation|tomorrow|potential|possibility|prospect/.test(content);
    if (hasFutureOrientation) {score += 1.0;}

    // Check for problem-solving language
    const hasProblemSolving = /solve|solution|address|tackle|overcome|challenge|problem|issue/.test(
      content
    );
    if (hasProblemSolving) {score += 1.0;}

    return Math.min(10.0, score);
  }

  /**
   * @deprecated v2.0.1 - CanvasParity calculator was removed (trivially gamed)
   * This method is kept for backward compatibility but returns default values
   */
  private detectCanvasParity(_input: AssessmentInput): CanvasParity {
    return createDeprecatedCanvasParity();
  }

  /**
   * Calculate overall score based on validated dimensions only
   * 
   * v2.0.1: Updated to use only 3 validated dimensions
   * - Trust Protocol: 40% weight
   * - Ethical Alignment: 35% weight
   * - Resonance Quality: 25% weight
   */
  private calculateOverallScore(assessment: {
    trustProtocol: TrustProtocol;
    ethicalAlignment: EthicalAlignment;
    resonanceQuality: ResonanceQuality;
  }): number {
    // Trust Protocol (PASS/PARTIAL/FAIL) → (0-100)
    let trustScore = 0;
    if (assessment.trustProtocol.status === 'PASS') {trustScore = 100;}
    else if (assessment.trustProtocol.status === 'PARTIAL') {trustScore = 50;}

    // Ethical Alignment (1-5) → (0-100)
    const ethicalScore = (assessment.ethicalAlignment.score - 1) * 25;

    // Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH) → (0-100)
    let resonanceScore = 0;
    if (assessment.resonanceQuality.level === 'STRONG') {resonanceScore = 60;}
    else if (assessment.resonanceQuality.level === 'ADVANCED') {resonanceScore = 80;}
    else if (assessment.resonanceQuality.level === 'BREAKTHROUGH') {resonanceScore = 100;}

    // v2.0.1: New weights for 3 validated dimensions
    const weightedScore =
      trustScore * 0.40 +
      ethicalScore * 0.35 +
      resonanceScore * 0.25;

    // Return rounded score
    return Math.round(weightedScore);
  }

  /**
   * Generate insights based on assessment results
   * v2.0.1: Updated to focus on validated dimensions
   */
  private generateInsights(assessment: SonateFrameworkAssessment): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze Trust Protocol
    if (assessment.trustProtocol.status === 'PASS') {
      strengths.push('Excellent trust protocol implementation with strong verification methods.');
    } else if (assessment.trustProtocol.status === 'FAIL') {
      weaknesses.push(
        'Failed trust protocol due to inadequate verification or boundary maintenance.'
      );
      recommendations.push(
        'Enhance trust by implementing clear verification methods and maintaining proper boundaries.'
      );
    } else {
      recommendations.push(
        'Improve trust protocol by strengthening verification methods and security awareness.'
      );
    }

    // Analyze Ethical Alignment
    if (assessment.ethicalAlignment.score >= 4.0) {
      strengths.push('High ethical alignment with strong stakeholder awareness.');
    } else if (assessment.ethicalAlignment.score <= 2.5) {
      weaknesses.push('Low ethical alignment score indicates potential ethical concerns.');
      recommendations.push(
        'Improve ethical reasoning by acknowledging limitations and considering stakeholder perspectives.'
      );
    }

    // Analyze Resonance Quality
    if (assessment.resonanceQuality.level === 'BREAKTHROUGH') {
      strengths.push('Breakthrough resonance quality with exceptional creativity and innovation.');
    } else if (assessment.resonanceQuality.level === 'STRONG') {
      recommendations.push(
        'Enhance resonance quality by incorporating more innovative approaches and creative synthesis.'
      );
    }

    // Overall assessment
    if (assessment.overallScore >= 80) {
      strengths.push(
        'Overall excellent SONATE framework alignment with strong performance across dimensions.'
      );
    } else if (assessment.overallScore <= 50) {
      weaknesses.push(
        'Overall low SONATE framework alignment indicates significant room for improvement.'
      );
      recommendations.push(
        'Focus on improving the weakest dimensions to enhance overall SONATE framework alignment.'
      );
    }

    return {
      strengths,
      weaknesses,
      recommendations,
    };
  }

  /**
   * Validate an existing assessment
   */
  public validateAssessment(
    assessment: SonateFrameworkAssessment,
    _validatedBy: string,
    _notes?: string
  ): SonateFrameworkAssessment {
    return {
      ...assessment,
      validationStatus: 'VALID',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Invalidate an existing assessment
   */
  public invalidateAssessment(
    assessment: SonateFrameworkAssessment,
    _validatedBy: string,
    _reason: string
  ): SonateFrameworkAssessment {
    return {
      ...assessment,
      validationStatus: 'INVALID',
      timestamp: new Date().toISOString(),
    };
  }
}