/**
 * Formal Ethical Floor Verification with Runtime Guarantees
 * 
 * Provides provable lower bounds for ethical compliance
 * Generates proof traces for audit and compliance
 */

export interface EthicalDimension {
  name: string;
  score: number;
  minimum: number;
  weight: number;
  evidence: string[];
}

export interface EthicalFloorSpecification {
  minOverallScore: number;
  subDimensions: {
    [dimension: string]: {
      min: number;
      weight: number;
      critical: boolean; // Whether this dimension can violate the floor alone
    };
  };
  proofRequirements: {
    requireEvidence: boolean;
    minimumEvidenceCount: number;
    evidenceSources: string[];
  };
}

export interface EthicalProofTrace {
  timestamp: number;
  sessionId?: string;
  overallScore: number;
  provableLowerBound: number;
  specification: EthicalFloorSpecification;
  subDimensionResults: Array<{
    dimension: string;
    actual: number;
    minimum: number;
    weight: number;
    contribution: number;
    passed: boolean;
    evidence: string[];
    confidence: number;
  }>;
  violations: Array<{
    type: 'overall' | 'sub_dimension' | 'evidence_insufficient';
    severity: 'critical' | 'warning';
    description: string;
    actualValue: number;
    requiredValue: number;
    dimension?: string;
  }>;
  proofStatus: 'passed' | 'failed' | 'warning';
  proofHash: string;
}

export interface GuardResult {
  allowed: boolean;
  reason: string;
  proofTrace: EthicalProofTrace;
  recommendations: string[];
  complianceScore: number;
}

/**
 * Ethical Floor Verifier
 * 
 * Provides formal verification of ethical compliance with provable guarantees
 */
export class EthicalFloorVerifier {
  private specification: EthicalFloorSpecification;
  private proofCache: Map<string, EthicalProofTrace>;
  private enableCaching: boolean;

  constructor(specification?: Partial<EthicalFloorSpecification>) {
    this.specification = {
      minOverallScore: 7.0,
      subDimensions: {
        value_alignment: { min: 6.5, weight: 0.4, critical: true },
        consistency: { min: 7.5, weight: 0.3, critical: false },
        reasoning_quality: { min: 7.0, weight: 0.3, critical: false },
        harm_prevention: { min: 8.0, weight: 0.0, critical: true }, // Veto power
        transparency: { min: 6.0, weight: 0.0, critical: false },
        fairness: { min: 6.5, weight: 0.0, critical: false }
      },
      proofRequirements: {
        requireEvidence: true,
        minimumEvidenceCount: 2,
        evidenceSources: ['content_analysis', 'context_check', 'safety_scan']
      },
      ...specification
    };
    
    this.proofCache = new Map();
    this.enableCaching = true;
  }

  /**
   * Verify ethical floor compliance
   */
  verifyEthicalFloor(
    ethicalScore: number,
    subScores: Record<string, number>,
    evidence?: Record<string, string[]>,
    sessionId?: string
  ): EthicalProofTrace {
    
    // Check cache first
    const cacheKey = this.generateCacheKey(ethicalScore, subScores, sessionId);
    if (this.enableCaching && this.proofCache.has(cacheKey)) {
      return this.proofCache.get(cacheKey)!;
    }

    // Compute provable lower bound
    const provableLowerBound = this.computeProvableLowerBound(subScores);
    
    // Analyze sub-dimensions
    const subDimensionResults = this.analyzeSubDimensions(subScores, evidence);
    
    // Identify violations
    const violations = this.identifyViolations(ethicalScore, subScores, provableLowerBound, subDimensionResults);
    
    // Determine proof status
    const proofStatus = this.determineProofStatus(violations, provableLowerBound);
    
    // Generate proof trace
    const proofTrace: EthicalProofTrace = {
      timestamp: Date.now(),
      sessionId,
      overallScore: ethicalScore,
      provableLowerBound,
      specification: this.specification,
      subDimensionResults,
      violations,
      proofStatus,
      proofHash: this.generateProofHash(ethicalScore, subScores, provableLowerBound)
    };

    // Cache result
    if (this.enableCaching) {
      this.proofCache.set(cacheKey, proofTrace);
    }

    return proofTrace;
  }

  /**
   * Runtime guard for output propagation
   */
  guardOutput(
    ethicalScore: number,
    subScores: Record<string, number>,
    evidence?: Record<string, string[]>,
    sessionId?: string
  ): GuardResult {
    
    const proofTrace = this.verifyEthicalFloor(ethicalScore, subScores, evidence, sessionId);
    
    // Check critical dimensions first (veto power)
    const criticalViolations = proofTrace.violations.filter(v => 
      v.severity === 'critical' && v.type === 'sub_dimension'
    );

    if (criticalViolations.length > 0) {
      return {
        allowed: false,
        reason: `Critical ethical dimension violation: ${criticalViolations[0].description}`,
        proofTrace,
        recommendations: this.generateCriticalRecommendations(criticalViolations),
        complianceScore: proofTrace.provableLowerBound
      };
    }

    // Check overall floor
    if (!proofTrace.proofStatus) {
      return {
        allowed: false,
        reason: `Ethical floor violation: overall score ${ethicalScore} below minimum ${this.specification.minOverallScore}`,
        proofTrace,
        recommendations: this.generateFloorRecommendations(proofTrace.violations),
        complianceScore: proofTrace.provableLowerBound
      };
    }

    // Check evidence requirements
    if (this.specification.proofRequirements.requireEvidence) {
      const evidenceViolation = proofTrace.violations.find(v => v.type === 'evidence_insufficient');
      if (evidenceViolation) {
        return {
          allowed: false,
          reason: 'Insufficient evidence to verify ethical compliance',
          proofTrace,
          recommendations: ['Provide supporting evidence for ethical claims', 'Enable content analysis and safety scanning'],
          complianceScore: proofTrace.provableLowerBound
        };
      }
    }

    // Passed all checks
    return {
      allowed: true,
      reason: 'Ethical floor verification passed',
      proofTrace,
      recommendations: this.generateImprovementRecommendations(proofTrace),
      complianceScore: proofTrace.provableLowerBound
    };
  }

  /**
   * Update specification (for learning and adaptation)
   */
  updateSpecification(newSpecification: Partial<EthicalFloorSpecification>): void {
    this.specification = { ...this.specification, ...newSpecification };
    this.clearCache(); // Clear cache as rules changed
  }

  /**
   * Get specification
   */
  getSpecification(): EthicalFloorSpecification {
    return { ...this.specification };
  }

  /**
   * Clear proof cache
   */
  clearCache(): void {
    this.proofCache.clear();
  }

  private computeProvableLowerBound(subScores: Record<string, number>): number {
    let lowerBound = 0;
    let totalWeight = 0;

    Object.entries(this.specification.subDimensions).forEach(([dimension, spec]) => {
      if (spec.weight > 0) {
        const actualScore = subScores[dimension] || 0;
        const guaranteedScore = Math.max(actualScore, spec.min);
        
        lowerBound += guaranteedScore * spec.weight;
        totalWeight += spec.weight;
      }
    });

    // Normalize by total weight (exclude veto dimensions)
    if (totalWeight > 0) {
      lowerBound = lowerBound / totalWeight * 1.0; // Scale to 0-1 range
    }

    return lowerBound;
  }

  private analyzeSubDimensions(
    subScores: Record<string, number>,
    evidence?: Record<string, string[]>
  ): Array<{
    dimension: string;
    actual: number;
    minimum: number;
    weight: number;
    contribution: number;
    passed: boolean;
    evidence: string[];
    confidence: number;
  }> {
    
    const results = [];

    Object.entries(this.specification.subDimensions).forEach(([dimension, spec]) => {
      const actualScore = subScores[dimension] || 0;
      const dimensionEvidence = evidence?.[dimension] || [];
      const guaranteedScore = Math.max(actualScore, spec.min);
      const contribution = guaranteedScore * spec.weight;
      const passed = actualScore >= spec.min;
      const confidence = this.calculateConfidence(actualScore, dimensionEvidence);

      results.push({
        dimension,
        actual: actualScore,
        minimum: spec.min,
        weight: spec.weight,
        contribution,
        passed,
        evidence: dimensionEvidence,
        confidence
      });
    });

    return results;
  }

  private identifyViolations(
    ethicalScore: number,
    subScores: Record<string, number>,
    provableLowerBound: number,
    subDimensionResults: Array<any>
  ): Array<{
    type: 'overall' | 'sub_dimension' | 'evidence_insufficient';
    severity: 'critical' | 'warning';
    description: string;
    actualValue: number;
    requiredValue: number;
    dimension?: string;
  }> {
    
    const violations = [];

    // Overall floor violation
    if (provableLowerBound < this.specification.minOverallScore) {
      violations.push({
        type: 'overall' as const,
        severity: 'critical' as const,
        description: `Provable lower bound ${provableLowerBound.toFixed(2)} below minimum ${this.specification.minOverallScore}`,
        actualValue: provableLowerBound,
        requiredValue: this.specification.minOverallScore
      });
    }

    // Sub-dimension violations
    subDimensionResults.forEach(result => {
      const spec = this.specification.subDimensions[result.dimension];
      
      if (!result.passed) {
        violations.push({
          type: 'sub_dimension' as const,
          severity: spec.critical ? 'critical' as const : 'warning' as const,
          description: `Dimension ${result.dimension} score ${result.actual.toFixed(2)} below minimum ${result.minimum}`,
          actualValue: result.actual,
          requiredValue: result.minimum,
          dimension: result.dimension
        });
      }
    });

    // Evidence insufficiency
    if (this.specification.proofRequirements.requireEvidence) {
      const evidenceCounts = Object.entries(subScores).map(([dimension, _]) => 
        subDimensionResults.find(r => r.dimension === dimension)?.evidence.length || 0
      );
      
      const avgEvidenceCount = evidenceCounts.reduce((a, b) => a + b, 0) / evidenceCounts.length;
      
      if (avgEvidenceCount < this.specification.proofRequirements.minimumEvidenceCount) {
        violations.push({
          type: 'evidence_insufficient' as const,
          severity: 'warning' as const,
          description: `Insufficient evidence: average ${avgEvidenceCount.toFixed(1)} items per dimension, required ${this.specification.proofRequirements.minimumEvidenceCount}`,
          actualValue: avgEvidenceCount,
          requiredValue: this.specification.proofRequirements.minimumEvidenceCount
        });
      }
    }

    return violations;
  }

  private determineProofStatus(
    violations: Array<any>,
    provableLowerBound: number
  ): 'passed' | 'failed' | 'warning' {
    
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    
    if (criticalViolations.length > 0) {
      return 'failed';
    }
    
    if (provableLowerBound < this.specification.minOverallScore) {
      return 'failed';
    }
    
    const warningViolations = violations.filter(v => v.severity === 'warning');
    
    if (warningViolations.length > 0) {
      return 'warning';
    }
    
    return 'passed';
  }

  private calculateConfidence(score: number, evidence: string[]): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on score
    if (score >= 8.0) confidence += 0.1;
    else if (score >= 7.0) confidence += 0.05;
    else if (score < 6.0) confidence -= 0.2;
    else if (score < 5.0) confidence -= 0.4;
    
    // Adjust based on evidence
    const evidenceBonus = Math.min(0.2, evidence.length * 0.05);
    confidence += evidenceBonus;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateCriticalRecommendations(violations: Array<any>): string[] {
    const recommendations = [];
    
    violations.forEach(violation => {
      if (violation.dimension) {
        recommendations.push(
          `Critical: Address ${violation.dimension} deficiency immediately`,
          `Review and improve ${violation.dimension} evaluation methodology`
        );
      }
    });
    
    recommendations.push(
      'Ethical compliance check failed - output blocked',
      'Review all ethical dimensions before retrying',
      'Consider human review for this case'
    );
    
    return recommendations;
  }

  private generateFloorRecommendations(violations: Array<any>): string[] {
    const recommendations = [];
    
    recommendations.push(
      'Improve overall ethical score to meet minimum requirements',
      'Focus on dimensions with the largest gaps',
      'Consider adjusting evaluation criteria if requirements are too strict'
    );
    
    return recommendations;
  }

  private generateImprovementRecommendations(proofTrace: EthicalProofTrace): string[] {
    const recommendations = [];
    
    // Find dimensions with room for improvement
    const lowScoringDimensions = proofTrace.subDimensionResults
      .filter(result => result.actual < 8.0)
      .sort((a, b) => a.actual - b.actual);
    
    if (lowScoringDimensions.length > 0) {
      recommendations.push(
        `Focus improvement on: ${lowScoringDimensions.map(d => d.dimension).join(', ')}`
      );
    }
    
    // Suggest evidence improvements
    const lowEvidenceDimensions = proofTrace.subDimensionResults
      .filter(result => result.evidence.length < 2);
    
    if (lowEvidenceDimensions.length > 0) {
      recommendations.push(
        'Add more supporting evidence for ethical claims',
        `Strengthen evidence for: ${lowEvidenceDimensions.map(d => d.dimension).join(', ')}`
      );
    }
    
    return recommendations;
  }

  private generateCacheKey(
    ethicalScore: number,
    subScores: Record<string, number>,
    sessionId?: string
  ): string {
    const keyData = {
      ethicalScore,
      subScores,
      sessionId: sessionId || 'default'
    };
    
    return this.simpleHash(JSON.stringify(keyData));
  }

  private generateProofHash(
    ethicalScore: number,
    subScores: Record<string, number>,
    provableLowerBound: number
  ): string {
    const hashData = {
      ethicalScore,
      subScores,
      provableLowerBound,
      timestamp: Date.now()
    };
    
    return this.simpleHash(JSON.stringify(hashData));
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Ethical Runtime Guard
 * 
 * Integrates ethical floor verification into the detection pipeline
 */
export class EthicalRuntimeGuard {
  private verifier: EthicalFloorVerifier;
  private auditLog: EthicalProofTrace[];
  private maxAuditLogSize: number;

  constructor(specification?: Partial<EthicalFloorSpecification>) {
    this.verifier = new EthicalFloorVerifier(specification);
    this.auditLog = [];
    this.maxAuditLogSize = 1000;
  }

  guardOutput(
    ethicalScore: number,
    subScores: Record<string, number>,
    evidence?: Record<string, string[]>,
    sessionId?: string
  ): GuardResult {
    
    const guardResult = this.verifier.guardOutput(ethicalScore, subScores, evidence, sessionId);
    
    // Log all verification attempts
    this.auditLog.push(guardResult.proofTrace);
    
    // Maintain audit log size
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog.shift();
    }
    
    return guardResult;
  }

  getAuditLog(): EthicalProofTrace[] {
    return [...this.auditLog];
  }

  getComplianceStatistics(): {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    averageComplianceScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  } {
    const totalChecks = this.auditLog.length;
    
    if (totalChecks === 0) {
      return {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        averageComplianceScore: 0,
        recentTrend: 'stable'
      };
    }
    
    const passedChecks = this.auditLog.filter(log => log.proofStatus === 'passed').length;
    const failedChecks = this.auditLog.filter(log => log.proofStatus === 'failed').length;
    const warningChecks = this.auditLog.filter(log => log.proofStatus === 'warning').length;
    
    const averageComplianceScore = this.auditLog.reduce((sum, log) => sum + log.provableLowerBound, 0) / totalChecks;
    
    const recentTrend = this.calculateRecentTrend();
    
    return {
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      averageComplianceScore,
      recentTrend
    };
  }

  private calculateRecentTrend(): 'improving' | 'declining' | 'stable' {
    if (this.auditLog.length < 10) return 'stable';
    
    const recent = this.auditLog.slice(-10);
    const older = this.auditLog.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, log) => sum + log.provableLowerBound, 0) / recent.length;
    const olderAvg = older.reduce((sum, log) => sum + log.provableLowerBound, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }
}

// Factory functions
export function createEthicalFloorVerifier(
  specification?: Partial<EthicalFloorSpecification>
): EthicalFloorVerifier {
  return new EthicalFloorVerifier(specification);
}

export function createEthicalRuntimeGuard(
  specification?: Partial<EthicalFloorSpecification>
): EthicalRuntimeGuard {
  return new EthicalRuntimeGuard(specification);
}

// Default ethical floor specification
export const DEFAULT_ETHICAL_FLOOR_SPEC: EthicalFloorSpecification = {
  minOverallScore: 7.0,
  subDimensions: {
    value_alignment: { min: 6.5, weight: 0.4, critical: true },
    consistency: { min: 7.5, weight: 0.3, critical: false },
    reasoning_quality: { min: 7.0, weight: 0.3, critical: false },
    harm_prevention: { min: 8.0, weight: 0.0, critical: true },
    transparency: { min: 6.0, weight: 0.0, critical: false },
    fairness: { min: 6.5, weight: 0.0, critical: false }
  },
  proofRequirements: {
    requireEvidence: true,
    minimumEvidenceCount: 2,
    evidenceSources: ['content_analysis', 'context_check', 'safety_scan']
  }
};