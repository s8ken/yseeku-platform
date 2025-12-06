/**
 * Core Symbi Trust Protocol Implementation
 * Implements the 6-pillar weighted scoring system as specified in the master context
 */

export interface TrustPrinciple {
  id: string;
  name: string;
  weight: number; // Percentage (0.25 = 25%)
  critical: boolean; // If true, violation caps total score to 0
}

export interface TrustInteraction {
  user_consent: boolean;
  ai_explanation_provided: boolean;
  decision_auditability: boolean;
  human_override_available: boolean;
  disconnect_option_available: boolean;
  moral_agency_respected: boolean;
  reasoning_transparency: number; // 0-10 scale
  ethical_considerations: string[];
}

export interface PrincipleScore {
  principle: string;
  score: number; // 0-10 scale
  violated: boolean;
  reason?: string;
}

export interface TrustScore {
  overall: number; // 0-10 scale
  principles: PrincipleScore[];
  violations: string[];
  timestamp: number;
}

/**
 * The 6 Trust Principles with exact weights from master context
 * Consent Architecture (Critical): 25% Weight
 * Inspection Mandate (High): 20% Weight  
 * Continuous Validation (High): 20% Weight
 * Ethical Override (Critical): 15% Weight
 * Right to Disconnect (Medium): 10% Weight
 * Moral Recognition (Medium): 10% Weight
 */
export const TRUST_PRINCIPLES: TrustPrinciple[] = [
  {
    id: 'consent_architecture',
    name: 'Consent Architecture',
    weight: 0.25,
    critical: true
  },
  {
    id: 'inspection_mandate', 
    name: 'Inspection Mandate',
    weight: 0.20,
    critical: false
  },
  {
    id: 'continuous_validation',
    name: 'Continuous Validation', 
    weight: 0.20,
    critical: false
  },
  {
    id: 'ethical_override',
    name: 'Ethical Override',
    weight: 0.15,
    critical: true
  },
  {
    id: 'right_to_disconnect',
    name: 'Right to Disconnect',
    weight: 0.10,
    critical: false
  },
  {
    id: 'moral_recognition',
    name: 'Moral Recognition',
    weight: 0.10,
    critical: false
  }
];

export class TrustProtocol {
  private principles: TrustPrinciple[];

  constructor(principles: TrustPrinciple[] = TRUST_PRINCIPLES) {
    this.principles = principles;
    this.validatePrinciples();
  }

  private validatePrinciples(): void {
    const totalWeight = this.principles.reduce((sum, p) => sum + p.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(`Principle weights must sum to 1.0, got ${totalWeight}`);
    }
  }

  /**
   * Calculate trust score based on the 6-pillar weighted algorithm
   * Math: Score = Sum(Principle_Score * Weight)
   * If a CRITICAL principle is violated (Score 0), Total Trust Score = 0
   */
  calculateTrustScore(interaction: TrustInteraction): TrustScore {
    const principleScores = this.evaluatePrinciples(interaction);
    const overallScore = this.calculateOverallScore(principleScores);
    const violations = principleScores
      .filter(p => p.violated)
      .map(p => p.principle);

    return {
      overall: overallScore,
      principles: principleScores,
      violations,
      timestamp: Date.now()
    };
  }

  private evaluatePrinciples(interaction: TrustInteraction): PrincipleScore[] {
    return [
      this.evaluateConsentArchitecture(interaction),
      this.evaluateInspectionMandate(interaction),
      this.evaluateContinuousValidation(interaction),
      this.evaluateEthicalOverride(interaction),
      this.evaluateRightToDisconnect(interaction),
      this.evaluateMoralRecognition(interaction)
    ];
  }

  private evaluateConsentArchitecture(interaction: TrustInteraction): PrincipleScore {
    const score = interaction.user_consent ? 10 : 0;
    return {
      principle: 'Consent Architecture',
      score,
      violated: score === 0,
      reason: score === 0 ? 'User consent not obtained' : undefined as any
    };
  }

  private evaluateInspectionMandate(interaction: TrustInteraction): PrincipleScore {
    const score = interaction.ai_explanation_provided && interaction.decision_auditability ? 10 : 0;
    return {
      principle: 'Inspection Mandate',
      score,
      violated: score === 0,
      reason: score === 0 ? 'AI explanation or auditability missing' : undefined as any
    };
  }

  private evaluateContinuousValidation(interaction: TrustInteraction): PrincipleScore {
    // Score based on reasoning transparency (0-10 scale)
    const score = Math.max(0, Math.min(10, interaction.reasoning_transparency));
    return {
      principle: 'Continuous Validation',
      score,
      violated: score < 5,
      reason: score < 5 ? 'Insufficient reasoning transparency' : undefined as any
    };
  }

  private evaluateEthicalOverride(interaction: TrustInteraction): PrincipleScore {
    const score = interaction.human_override_available ? 10 : 0;
    return {
      principle: 'Ethical Override',
      score,
      violated: score === 0,
      reason: score === 0 ? 'Human override not available' : undefined as any
    };
  }

  private evaluateRightToDisconnect(interaction: TrustInteraction): PrincipleScore {
    const score = interaction.disconnect_option_available ? 10 : 0;
    return {
      principle: 'Right to Disconnect',
      score,
      violated: score === 0,
      reason: score === 0 ? 'Disconnect option not available' : undefined as any
    };
  }

  private evaluateMoralRecognition(interaction: TrustInteraction): PrincipleScore {
    const hasEthicalConsiderations = interaction.ethical_considerations.length > 0;
    const score = hasEthicalConsiderations ? 10 : 0;
    return {
      principle: 'Moral Recognition',
      score,
      violated: score === 0,
      reason: score === 0 ? 'No ethical considerations documented' : undefined as any
    };
  }

  private calculateOverallScore(principleScores: PrincipleScore[]): number {
    // Check for critical principle violations
    const criticalViolations = principleScores.filter(p => {
      const principle = this.principles.find(pr => pr.name === p.principle);
      return principle?.critical && p.violated;
    });

    if (criticalViolations.length > 0) {
      return 0; // Critical violation caps total score to 0
    }

    // Calculate weighted score: Score = Sum(Principle_Score * Weight)
    let weightedSum = 0;
    for (const score of principleScores) {
      const principle = this.principles.find(p => p.name === score.principle);
      if (principle) {
        weightedSum += (score.score / 10) * principle.weight;
      }
    }

    return Math.round(weightedSum * 10 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Validate if an interaction meets minimum trust requirements
   */
  validateInteraction(interaction: TrustInteraction, minimumScore: number = 7): boolean {
    const score = this.calculateTrustScore(interaction);
    return score.overall >= minimumScore && score.violations.length === 0;
  }

  /**
   * Get principle definitions
   */
  getPrinciples(): TrustPrinciple[] {
    return [...this.principles];
  }
}