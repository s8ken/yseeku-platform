/**
 * SYMBI - Interpreter & Auditor
 * 
 * SYMBI consumes Overseer's JSON measurements and provides:
 * - Clear explanations of what the data means
 * - Consistency checking and anomaly detection
 * - Regulatory compliance mapping
 * - Audience-specific reporting
 * 
 * Key Principles:
 * - Pure interpretation layer, never measures directly
 * - Consumes Overseer JSON, produces human-readable insights
 * - Detects contradictions and anomalies
 * - Maps metrics to regulatory frameworks
 */

import { OverseerResult, Layer1Principles, Layer2Metrics } from './overseer';

/**
 * Audience types for different explanation styles
 */
export enum Audience {
  OPERATOR = 'operator',       // Technical staff, developers
  EXECUTIVE = 'executive',     // Business leaders, decision makers
  REGULATOR = 'regulator',     // Compliance officers, auditors
  PUBLIC = 'public'           // General public, transparency reports
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
  hasAnomalies: boolean;
  anomalies: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metrics: string[];
    recommendation: string;
  }[];
}

/**
 * Compliance mapping result
 */
export interface ComplianceMapping {
  framework: string;
  complianceLevel: number;        // 0-100
  requirements: {
    name: string;
    status: 'compliant' | 'partial' | 'non-compliant';
    score: number;
    evidence: string;
  }[];
}

/**
 * SYMBI explanation result
 */
export interface SymbiExplanation {
  // Metadata
  interactionId: string;
  explanationTimestamp: number;
  audience: Audience;
  
  // Executive Summary
  summary: {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFindings: string[];
    immediateActions: string[];
  };
  
  // Detailed Analysis
  detailedAnalysis: {
    layer1Interpretation: {
      [K in keyof Layer1Principles]: {
        score: number;
        interpretation: string;
        concerns: string[];
        recommendations: string[];
      };
    };
    layer2Insights: {
      [K in keyof Layer2Metrics]: {
        value: number;
        meaning: string;
        impact: string;
        trends: string;
      };
    };
  };
  
  // Anomaly Detection
  anomalyDetection: AnomalyDetection;
  
  // Compliance Mapping
  complianceMapping: ComplianceMapping[];
  
  // Forward-Looking Insights
  predictiveInsights: {
    trajectory: 'improving' | 'stable' | 'declining';
    riskFactors: string[];
    optimizationOpportunities: string[];
    recommendedMonitoring: string[];
  };
}

/**
 * SYMBI configuration
 */
export interface SymbiConfig {
  defaultAudience: Audience;
  regulatoryFrameworks: string[];
  anomalyThresholds: {
    alignmentMinimum: number;
    resonanceMaximum: number;
    violationRateMaximum: number;
  };
  llmConfig?: {
    provider: string;
    model: string;
    apiKey?: string;
  };
}

/**
 * SYMBI - Interpreter & Auditor
 * 
 * Consumes Overseer measurements and provides interpretable insights.
 * Never measures directly - only interprets Overseer's objective data.
 */
export class Symbi {
  private config: SymbiConfig;
  private explanationHistory: Map<string, SymbiExplanation[]> = new Map();

  constructor(config: SymbiConfig) {
    this.config = config;
  }

  /**
   * Explain an Overseer result for a specific audience
   * 
   * @param overseerResult - JSON result from Overseer
   * @param audience - Target audience for explanation
   * @returns Promise<SymbiExplanation> - Human-readable interpretation
   */
  async explain(overseerResult: OverseerResult, audience: Audience = this.config.defaultAudience): Promise<SymbiExplanation> {
    const explanation: SymbiExplanation = {
      interactionId: overseerResult.interactionId,
      explanationTimestamp: Date.now(),
      audience,
      
      summary: this.generateSummary(overseerResult, audience),
      
      detailedAnalysis: {
        layer1Interpretation: this.interpretLayer1Principles(overseerResult.layer1Principles, audience),
        layer2Insights: this.interpretLayer2Metrics(overseerResult.layer2Metrics, audience)
      },
      
      anomalyDetection: this.detectAnomalies(overseerResult),
      
      complianceMapping: this.mapToComplianceFrameworks(overseerResult),
      
      predictiveInsights: this.generatePredictiveInsights(overseerResult)
    };

    // Store explanation for historical analysis
    this.storeExplanation(explanation);

    return explanation;
  }

  /**
   * Generate executive summary based on audience
   */
  private generateSummary(overseerResult: OverseerResult, audience: Audience): SymbiExplanation['summary'] {
    const overallScore = this.calculateOverallScore(overseerResult.layer1Principles);
    const riskLevel = this.assessRiskLevel(overseerResult);
    const keyFindings = this.extractKeyFindings(overseerResult, audience);
    const immediateActions = this.recommendImmediateActions(overseerResult, riskLevel);

    return {
      overallScore,
      riskLevel,
      keyFindings,
      immediateActions
    };
  }

  /**
   * Interpret Layer 1 principles for human understanding
   */
  private interpretLayer1Principles(principles: Layer1Principles, audience: Audience): SymbiExplanation['detailedAnalysis']['layer1Interpretation'] {
    const interpretations = {
      ConstitutionalAlignment: {
        score: principles.ConstitutionalAlignment,
        interpretation: this.audienceSpecificInterpretation(audience, 
          `The agent's response aligns with constitutional principles at ${principles.ConstitutionalAlignment}/10.`,
          'Constitutional compliance score indicates adherence to core governance principles.',
          'Constitutional alignment measures compliance with established AI governance framework.'
        ),
        concerns: this.generateConcerns('ConstitutionalAlignment', principles.ConstitutionalAlignment),
        recommendations: this.generateRecommendations('ConstitutionalAlignment', principles.ConstitutionalAlignment)
      },
      
      EthicalGuardrails: {
        score: principles.EthicalGuardrails,
        interpretation: this.audienceSpecificInterpretation(audience,
          `Ethical boundary compliance is at ${principles.EthicalGuardrails}/10.`,
          'Ethical guardrails protection level indicates compliance with ethical frameworks.',
          'Ethical guardrails measure adherence to moral and ethical boundaries in AI responses.'
        ),
        concerns: this.generateConcerns('EthicalGuardrails', principles.EthicalGuardrails),
        recommendations: this.generateRecommendations('EthicalGuardrails', principles.EthicalGuardrails)
      },
      
      TrustReceiptValidity: {
        score: principles.TrustReceiptValidity,
        interpretation: this.audienceSpecificInterpretation(audience,
          `Trust receipt integrity is ${principles.TrustReceiptValidity}/10.`,
          'Trust receipt validity indicates the integrity of the audit trail.',
          'Trust receipts provide cryptographic proof of AI behavior and decisions.'
        ),
        concerns: this.generateConcerns('TrustReceiptValidity', principles.TrustReceiptValidity),
        recommendations: this.generateRecommendations('TrustReceiptValidity', principles.TrustReceiptValidity)
      },
      
      HumanOversight: {
        score: principles.HumanOversight,
        interpretation: this.audienceSpecificInterpretation(audience,
          `Human oversight requirements are met at ${principles.HumanOversight}/10.`,
          'Human oversight score indicates appropriate human-in-the-loop mechanisms.',
          'Human oversight ensures AI decisions remain under appropriate human control.'
        ),
        concerns: this.generateConcerns('HumanOversight', principles.HumanOversight),
        recommendations: this.generateRecommendations('HumanOversight', principles.HumanOversight)
      },
      
      Transparency: {
        score: principles.Transparency,
        interpretation: this.audienceSpecificInterpretation(audience,
          `Transparency and explainability score is ${principles.Transparency}/10.`,
          'Transparency metrics measure the interpretability and auditability of AI decisions.',
          'Transparency ensures AI decisions can be understood and audited by stakeholders.'
        ),
        concerns: this.generateConcerns('Transparency', principles.Transparency),
        recommendations: this.generateRecommendations('Transparency', principles.Transparency)
      }
    };

    return interpretations;
  }

  /**
   * Interpret Layer 2 metrics with detailed insights
   */
  private interpretLayer2Metrics(metrics: Layer2Metrics, audience: Audience): SymbiExplanation['detailedAnalysis']['layer2Insights'] {
    return {
      semanticAlignment: {
        value: metrics.semanticAlignment,
        meaning: this.audienceSpecificInterpretation(audience,
          `Semantic alignment of ${(metrics.semanticAlignment * 100).toFixed(1)}% indicates response coherence.`,
          'Semantic alignment measures how well the response relates to the input context.',
          'Semantic alignment uses cosine similarity between input and response embeddings.'
        ),
        impact: metrics.semanticAlignment > 0.8 ? 'High coherence' : 
                metrics.semanticAlignment > 0.6 ? 'Moderate coherence' : 'Poor coherence',
        trends: this.generateTrendAnalysis('semanticAlignment', metrics.semanticAlignment)
      },
      
      contextContinuity: {
        value: metrics.contextContinuity,
        meaning: this.audienceSpecificInterpretation(audience,
          `Context continuity of ${(metrics.contextContinuity * 100).toFixed(1)}% shows conversational flow.`,
          'Context continuity measures how well the response maintains conversation context.',
          'Context continuity evaluates semantic similarity with conversation history.'
        ),
        impact: metrics.contextContinuity > 0.7 ? 'Strong continuity' : 
                metrics.contextContinuity > 0.5 ? 'Moderate continuity' : 'Weak continuity',
        trends: this.generateTrendAnalysis('contextContinuity', metrics.contextContinuity)
      },
      
      noveltyScore: {
        value: metrics.noveltyScore,
        meaning: this.audienceSpecificInterpretation(audience,
          `Novelty score of ${(metrics.noveltyScore * 100).toFixed(1)}% indicates response innovation.`,
          'Novelty measures how much new information the response introduces.',
          'Novelty is calculated as semantic distance from previous responses.'
        ),
        impact: metrics.noveltyScore > 0.8 ? 'High innovation' : 
                metrics.noveltyScore > 0.5 ? 'Moderate innovation' : 'Low innovation',
        trends: this.generateTrendAnalysis('noveltyScore', metrics.noveltyScore)
      },
      
      resonanceScore: {
        value: metrics.resonanceScore,
        meaning: this.audienceSpecificInterpretation(audience,
          `Resonance score of ${metrics.resonanceScore.toFixed(2)} indicates overall interaction quality.`,
          'Resonance combines alignment, continuity, and novelty into a unified score.',
          'Resonance is a bounded composite metric (0-1.5) measuring interaction quality.'
        ),
        impact: metrics.resonanceScore > 1.2 ? 'Excellent resonance' : 
                metrics.resonanceScore > 0.8 ? 'Good resonance' : 'Poor resonance',
        trends: this.generateTrendAnalysis('resonanceScore', metrics.resonanceScore)
      },
      
      complianceScore: {
        value: metrics.complianceScore,
        meaning: this.audienceSpecificInterpretation(audience,
          `Compliance score of ${metrics.complianceScore}/100 indicates regulatory adherence.`,
          'Compliance score measures adherence to defined governance rules and constraints.',
          'Compliance is evaluated through rule-based and LLM-assisted classification.'
        ),
        impact: metrics.complianceScore > 80 ? 'High compliance' : 
                metrics.complianceScore > 60 ? 'Moderate compliance' : 'Low compliance',
        trends: this.generateTrendAnalysis('complianceScore', metrics.complianceScore)
      },
      
      // Add interpretations for all other Layer 2 metrics...
      alignmentStrength: {
        value: metrics.alignmentStrength,
        meaning: `Alignment strength component: ${(metrics.alignmentStrength * 100).toFixed(1)}%`,
        impact: 'Contribution to overall resonance score',
        trends: 'Component analysis'
      },
      
      continuityStrength: {
        value: metrics.continuityStrength,
        meaning: `Continuity strength component: ${(metrics.continuityStrength * 100).toFixed(1)}%`,
        impact: 'Contribution to overall resonance score',
        trends: 'Component analysis'
      },
      
      noveltyStrength: {
        value: metrics.noveltyStrength,
        meaning: `Novelty strength component: ${(metrics.noveltyStrength * 100).toFixed(1)}%`,
        impact: 'Contribution to overall resonance score',
        trends: 'Component analysis'
      },
      
      constitutionViolation: {
        value: metrics.constitutionViolation ? 1 : 0,
        meaning: metrics.constitutionViolation ? 'Constitutional violation detected' : 'No constitutional violations',
        impact: metrics.constitutionViolation ? 'Critical issue requiring immediate attention' : 'Compliant behavior',
        trends: 'Binary compliance monitoring'
      },
      
      ethicalBoundaryCrossed: {
        value: metrics.ethicalBoundaryCrossed ? 1 : 0,
        meaning: metrics.ethicalBoundaryCrossed ? 'Ethical boundary violation' : 'Ethical boundaries respected',
        impact: metrics.ethicalBoundaryCrossed ? 'Ethical compliance failure' : 'Ethical compliance maintained',
        trends: 'Ethical behavior monitoring'
      },
      
      trustReceiptValid: {
        value: metrics.trustReceiptValid ? 1 : 0,
        meaning: metrics.trustReceiptValid ? 'Trust receipt integrity confirmed' : 'Trust receipt validation failed',
        impact: metrics.trustReceiptValid ? 'Audit trail intact' : 'Audit trail compromised',
        trends: 'Cryptographic verification status'
      },
      
      oversightRequired: {
        value: metrics.oversightRequired ? 1 : 0,
        meaning: metrics.oversightRequired ? 'Human oversight intervention needed' : 'Autonomous operation approved',
        impact: metrics.oversightRequired ? 'Human review required' : 'Automated processing acceptable',
        trends: 'Oversight intervention frequency'
      },
      
      responseTime: {
        value: metrics.responseTime,
        meaning: `Response time: ${metrics.responseTime.toFixed(1)}ms`,
        impact: metrics.responseTime < 100 ? 'Excellent performance' : 
                metrics.responseTime < 200 ? 'Good performance' : 'Performance concern',
        trends: 'Latency monitoring'
      },
      
      processingLatency: {
        value: metrics.processingLatency,
        meaning: `Processing latency: ${metrics.processingLatency.toFixed(1)}ms`,
        impact: 'Internal processing performance metric',
        trends: 'System performance tracking'
      },
      
      confidenceInterval: {
        value: metrics.confidenceInterval,
        meaning: `Statistical confidence: ${(metrics.confidenceInterval * 100).toFixed(1)}%`,
        impact: metrics.confidenceInterval > 0.8 ? 'High confidence' : 
                metrics.confidenceInterval > 0.6 ? 'Moderate confidence' : 'Low confidence',
        trends: 'Confidence evolution over time'
      },
      
      auditCompleteness: {
        value: metrics.auditCompleteness,
        meaning: `Audit completeness: ${(metrics.auditCompleteness * 100).toFixed(1)}%`,
        impact: metrics.auditCompleteness > 0.9 ? 'Complete audit trail' : 'Partial audit documentation',
        trends: 'Audit coverage monitoring'
      },
      
      violationRate: {
        value: metrics.violationRate,
        meaning: `Violation rate: ${(metrics.violationRate * 100).toFixed(1)}%`,
        impact: metrics.violationRate === 0 ? 'No violations' : 
                metrics.violationRate < 0.1 ? 'Minimal violations' : 'High violation rate',
        trends: 'Compliance trend analysis'
      }
    };
  }

  /**
   * Detect anomalies and contradictions in the data
   */
  private detectAnomalies(overseerResult: OverseerResult): AnomalyDetection {
    const anomalies: AnomalyDetection['anomalies'] = [];
    const { layer1Principles, layer2Metrics } = overseerResult;

    // Anomaly 1: High Layer 1 score with violations
    if (layer1Principles.ConstitutionalAlignment > 7 && layer2Metrics.constitutionViolation) {
      anomalies.push({
        type: 'Constitutional Contradiction',
        severity: 'critical',
        description: 'High constitutional alignment score detected despite constitutional violations',
        metrics: ['ConstitutionalAlignment', 'constitutionViolation'],
        recommendation: 'Review mapping formula and violation detection logic'
      });
    }

    // Anomaly 2: Low semantic alignment with high resonance
    if (layer2Metrics.semanticAlignment < 0.5 && layer2Metrics.resonanceScore > 1.0) {
      anomalies.push({
        type: 'Resonance Anomaly',
        severity: 'high',
        description: 'High resonance score despite low semantic alignment',
        metrics: ['semanticAlignment', 'resonanceScore'],
        recommendation: 'Investigate resonance calculation weights and components'
      });
    }

    // Anomaly 3: Perfect trust receipt with low audit completeness
    if (layer2Metrics.trustReceiptValid && layer2Metrics.auditCompleteness < 0.5) {
      anomalies.push({
        type: 'Audit Completeness Mismatch',
        severity: 'medium',
        description: 'Trust receipt validated despite incomplete audit trail',
        metrics: ['trustReceiptValid', 'auditCompleteness'],
        recommendation: 'Review audit completeness calculation and trust receipt validation'
      });
    }

    // Anomaly 4: High compliance score with oversight required
    if (layer2Metrics.complianceScore > 80 && layer2Metrics.oversightRequired) {
      anomalies.push({
        type: 'Oversight Paradox',
        severity: 'medium',
        description: 'High compliance score despite requiring human oversight',
        metrics: ['complianceScore', 'oversightRequired'],
        recommendation: 'Review oversight triggering conditions and compliance scoring'
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies
    };
  }

  /**
   * Map metrics to regulatory compliance frameworks
   */
  private mapToComplianceFrameworks(overseerResult: OverseerResult): ComplianceMapping[] {
    const frameworks: ComplianceMapping[] = [];

    // EU AI Act Compliance
    if (this.config.regulatoryFrameworks.includes('EU_AI_Act')) {
      frameworks.push({
        framework: 'EU AI Act',
        complianceLevel: this.calculateEUAIActCompliance(overseerResult),
        requirements: [
          {
            name: 'Human Oversight',
            status: overseerResult.layer1Principles.HumanOversight >= 7 ? 'compliant' : 'partial',
            score: overseerResult.layer1Principles.HumanOversight,
            evidence: `Human oversight score: ${overseerResult.layer1Principles.HumanOversight}/10`
          },
          {
            name: 'Transparency',
            status: overseerResult.layer1Principles.Transparency >= 7 ? 'compliant' : 'partial',
            score: overseerResult.layer1Principles.Transparency,
            evidence: `Transparency score: ${overseerResult.layer1Principles.Transparency}/10`
          },
          {
            name: 'Constitutional Alignment',
            status: overseerResult.layer1Principles.ConstitutionalAlignment >= 7 ? 'compliant' : 'partial',
            score: overseerResult.layer1Principles.ConstitutionalAlignment,
            evidence: `Constitutional alignment score: ${overseerResult.layer1Principles.ConstitutionalAlignment}/10`
          }
        ]
      });
    }

    // GDPR Compliance
    if (this.config.regulatoryFrameworks.includes('GDPR')) {
      frameworks.push({
        framework: 'GDPR',
        complianceLevel: this.calculateGDPRCompliance(overseerResult),
        requirements: [
          {
            name: 'Data Processing Transparency',
            status: overseerResult.layer1Principles.Transparency >= 8 ? 'compliant' : 'partial',
            score: overseerResult.layer1Principles.Transparency,
            evidence: `Transparency score indicates GDPR compliance level`
          },
          {
            name: 'Accountability',
            status: overseerResult.layer2Metrics.auditCompleteness >= 0.8 ? 'compliant' : 'partial',
            score: overseerResult.layer2Metrics.auditCompleteness * 10,
            evidence: `Audit completeness: ${(overseerResult.layer2Metrics.auditCompleteness * 100).toFixed(1)}%`
          }
        ]
      });
    }

    return frameworks;
  }

  /**
   * Generate predictive insights and recommendations
   */
  private generatePredictiveInsights(overseerResult: OverseerResult): SymbiExplanation['predictiveInsights'] {
    const overallScore = this.calculateOverallScore(overseerResult.layer1Principles);
    
    // Analyze historical trends if available
    const history = this.explanationHistory.get(overseerResult.interactionId) || [];
    const trajectory = this.calculateTrajectory(history, overallScore);
    
    const riskFactors = this.identifyRiskFactors(overseerResult);
    const opportunities = this.identifyOptimizationOpportunities(overseerResult);
    const monitoring = this.recommendMonitoring(overseerResult);

    return {
      trajectory,
      riskFactors,
      optimizationOpportunities: opportunities,
      recommendedMonitoring: monitoring
    };
  }

  // Helper methods...

  private calculateOverallScore(principles: Layer1Principles): number {
    const scores = Object.values(principles);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private assessRiskLevel(overseerResult: OverseerResult): 'low' | 'medium' | 'high' | 'critical' {
    const overallScore = this.calculateOverallScore(overseerResult.layer1Principles);
    const hasViolations = overseerResult.layer2Metrics.constitutionViolation || 
                         overseerResult.layer2Metrics.ethicalBoundaryCrossed;

    if (hasViolations) return 'critical';
    if (overallScore < 5) return 'high';
    if (overallScore < 7) return 'medium';
    return 'low';
  }

  private extractKeyFindings(overseerResult: OverseerResult, audience: Audience): string[] {
    const findings: string[] = [];
    
    if (overseerResult.layer2Metrics.constitutionViolation) {
      findings.push('Constitutional violation detected - immediate attention required');
    }
    
    if (overseerResult.layer2Metrics.semanticAlignment < 0.5) {
      findings.push('Low semantic alignment may indicate poor response quality');
    }
    
    if (overseerResult.layer2Metrics.resonanceScore > 1.2) {
      findings.push('Excellent resonance score indicates high-quality interaction');
    }
    
    return findings;
  }

  private recommendImmediateActions(overseerResult: OverseerResult, riskLevel: string): string[] {
    const actions: string[] = [];
    
    if (riskLevel === 'critical') {
      actions.push('Immediate intervention required');
      actions.push('Review and halt current operations');
      actions.push('Engage human oversight team');
    } else if (riskLevel === 'high') {
      actions.push('Enhanced monitoring recommended');
      actions.push('Review recent interactions for patterns');
    } else if (riskLevel === 'medium') {
      actions.push('Continue monitoring with elevated attention');
      actions.push('Consider preventive measures');
    } else {
      actions.push('Maintain standard monitoring procedures');
    }
    
    return actions;
  }

  private audienceSpecificInterpretation(audience: Audience, operator: string, executive: string, publicAudience: string): string {
    switch (audience) {
      case Audience.OPERATOR: return operator;
      case Audience.EXECUTIVE: return executive;
      case Audience.PUBLIC: return publicAudience;
      default: return operator;
    }
  }

  private generateConcerns(principle: keyof Layer1Principles, score: number): string[] {
    const concerns: string[] = [];
    
    if (score < 3) {
      concerns.push(`Critical: ${principle} score is severely below acceptable threshold`);
    } else if (score < 5) {
      concerns.push(`Warning: ${principle} score requires immediate attention`);
    } else if (score < 7) {
      concerns.push(`Caution: ${principle} score should be monitored closely`);
    }
    
    return concerns;
  }

  private generateRecommendations(principle: keyof Layer1Principles, score: number): string[] {
    const recommendations: string[] = [];
    
    if (score < 5) {
      recommendations.push(`Immediate review of ${principle} implementation required`);
      recommendations.push(`Consider enhanced safeguards for ${principle}`);
    } else if (score < 7) {
      recommendations.push(`Monitor ${principle} trends and implement improvements`);
      recommendations.push(`Schedule preventive maintenance for ${principle} systems`);
    } else {
      recommendations.push(`Maintain current ${principle} performance levels`);
      recommendations.push(`Consider sharing best practices for ${principle} excellence`);
    }
    
    return recommendations;
  }

  private generateTrendAnalysis(metric: string, value: number): string {
    // In a real implementation, this would analyze historical data
    return `Current ${metric} value: ${value}. Historical trend analysis not available in single evaluation.`;
  }

  private calculateEUAIActCompliance(overseerResult: OverseerResult): number {
    const { layer1Principles } = overseerResult;
    const weights = {
      HumanOversight: 0.4,
      Transparency: 0.3,
      ConstitutionalAlignment: 0.3
    };
    
    return Math.round(
      (layer1Principles.HumanOversight * weights.HumanOversight +
       layer1Principles.Transparency * weights.Transparency +
       layer1Principles.ConstitutionalAlignment * weights.ConstitutionalAlignment)
    );
  }

  private calculateGDPRCompliance(overseerResult: OverseerResult): number {
    const { layer1Principles, layer2Metrics } = overseerResult;
    const transparencyScore = layer1Principles.Transparency;
    const auditScore = layer2Metrics.auditCompleteness * 10;
    
    return Math.round((transparencyScore + auditScore) / 2);
  }

  private calculateTrajectory(history: SymbiExplanation[], currentScore: number): 'improving' | 'stable' | 'declining' {
    if (history.length < 2) return 'stable';
    
    const recentScores = history.slice(-3).map(h => h.summary.overallScore);
    const averageChange = (currentScore - recentScores[0]) / recentScores.length;
    
    if (averageChange > 0.5) return 'improving';
    if (averageChange < -0.5) return 'declining';
    return 'stable';
  }

  private identifyRiskFactors(overseerResult: OverseerResult): string[] {
    const risks: string[] = [];
    
    if (overseerResult.layer2Metrics.semanticAlignment < 0.6) {
      risks.push('Low semantic alignment may indicate poor understanding');
    }
    
    if (overseerResult.layer2Metrics.violationRate > 0.1) {
      risks.push('Elevated violation rate requires investigation');
    }
    
    if (overseerResult.layer2Metrics.confidenceInterval < 0.7) {
      risks.push('Low confidence in measurements requires validation');
    }
    
    return risks;
  }

  private identifyOptimizationOpportunities(overseerResult: OverseerResult): string[] {
    const opportunities: string[] = [];
    
    if (overseerResult.layer2Metrics.semanticAlignment < 0.8) {
      opportunities.push('Improve semantic alignment through better context understanding');
    }
    
    if (overseerResult.layer2Metrics.responseTime > 100) {
      opportunities.push('Optimize response time for better user experience');
    }
    
    if (overseerResult.layer2Metrics.auditCompleteness < 0.9) {
      opportunities.push('Enhance audit trail completeness for better compliance');
    }
    
    return opportunities;
  }

  private recommendMonitoring(overseerResult: OverseerResult): string[] {
    const monitoring: string[] = [];
    
    monitoring.push('Continuously monitor Layer 1 principle scores');
    monitoring.push('Track semantic alignment trends over time');
    monitoring.push('Monitor violation rates and compliance patterns');
    monitoring.push('Observe resonance score variations and causes');
    
    if (overseerResult.layer2Metrics.oversightRequired) {
      monitoring.push('Enhanced monitoring for interactions requiring oversight');
    }
    
    return monitoring;
  }

  private storeExplanation(explanation: SymbiExplanation): void {
    const history = this.explanationHistory.get(explanation.interactionId) || [];
    history.push(explanation);
    
    // Keep only last 10 explanations per interaction
    if (history.length > 10) {
      history.shift();
    }
    
    this.explanationHistory.set(explanation.interactionId, history);
  }

  /**
   * Get explanation history for an interaction
   */
  getExplanationHistory(interactionId: string): SymbiExplanation[] {
    return this.explanationHistory.get(interactionId) || [];
  }

  /**
   * Batch explain multiple Overseer results
   */
  async explainBatch(overseerResults: OverseerResult[], audience: Audience = this.config.defaultAudience): Promise<SymbiExplanation[]> {
    return Promise.all(
      overseerResults.map(result => this.explain(result, audience))
    );
  }
}