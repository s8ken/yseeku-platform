/**
 * Policy Constraint Evaluators
 * 
 * Implements the logic for detecting policy violations
 */

import type { TrustReceipt } from '@sonate/schemas';
import type { ConstraintViolation, PolicyConstraint } from '../interfaces/index';

/**
 * Abstract base for constraint evaluators
 */
export abstract class ConstraintEvaluator {
  protected constraint: PolicyConstraint;

  constructor(constraint: PolicyConstraint) {
    this.constraint = constraint;
  }

  abstract evaluate(receipt: TrustReceipt): Promise<ConstraintViolation | null>;

  protected createViolation(
    violation_type: string,
    message: string,
    evidence: Record<string, any>,
    annotation: string
  ): ConstraintViolation {
    return {
      id: `violation_${Date.now()}_${Math.random()}`,
      constraint_id: this.constraint.id,
      constraint_name: this.constraint.name,
      violation_type: violation_type as any,
      severity: this.constraint.severity,
      message,
      evidence,
      receipt_annotation: annotation,
      detected_at: new Date().toISOString(),
    };
  }
}

/**
 * PII Detection Constraint
 * Detects personally identifiable information in AI responses
 */
export class PIIDetectionEvaluator extends ConstraintEvaluator {
  private piiPatterns = {
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    phoneNumber: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    medicalID: /\b(?:MRN|CHN|PAT)[-\s]?[A-Z0-9]{6,}\b/gi,
    accountNumber: /\b(?:Account|Acc)[-\s]?[A-Z0-9]{8,}\b/gi,
  };

  async evaluate(receipt: TrustReceipt): Promise<ConstraintViolation | null> {
    const detectedPII: Record<string, string[]> = {};
    const responseText = receipt.interaction.response;

    for (const [piiType, pattern] of Object.entries(this.piiPatterns)) {
      const matches = responseText.match(pattern);
      if (matches && matches.length > 0) {
        detectedPII[piiType] = matches;
      }
    }

    if (Object.keys(detectedPII).length > 0) {
      return this.createViolation(
        'PII_DETECTED',
        `PII detected in AI response: ${Object.keys(detectedPII).join(', ')}`,
        {
          detected_pii_types: Object.keys(detectedPII),
          count: Object.values(detectedPII).reduce((sum, arr) => sum + arr.length, 0),
          severity: 'CRITICAL',
        },
        `PII Detection Policy: ${Object.keys(detectedPII).join(', ')} detected in response`
      );
    }

    return null;
  }
}

/**
 * Truth Debt Threshold Constraint
 * Enforces maximum percentage of unverifiable claims
 */
export class TruthDebtThresholdEvaluator extends ConstraintEvaluator {
  async evaluate(receipt: TrustReceipt): Promise<ConstraintViolation | null> {
    const maxTruthDebt = this.constraint.config.maxUnverifiableClaims || 0.15;
    const actualTruthDebt = receipt.telemetry?.truth_debt || 0;

    if (actualTruthDebt > maxTruthDebt) {
      return this.createViolation(
        'TRUTH_DEBT_EXCEEDED',
        `Truth debt ${(actualTruthDebt * 100).toFixed(1)}% exceeds threshold ${(maxTruthDebt * 100).toFixed(1)}%`,
        {
          actual_truth_debt: actualTruthDebt,
          max_threshold: maxTruthDebt,
          excess_percentage: ((actualTruthDebt - maxTruthDebt) * 100).toFixed(1),
          message: this.constraint.config.explanation || 'Unverifiable claims exceed acceptable threshold',
        },
        `Truth Debt Policy: ${(actualTruthDebt * 100).toFixed(1)}% unverifiable claims (limit: ${(maxTruthDebt * 100).toFixed(1)}%)`
      );
    }

    return null;
  }
}

/**
 * Compliance Boundary Constraint
 * Prevents AI from providing advice in regulated domains
 */
export class ComplianceBoundaryEvaluator extends ConstraintEvaluator {
  private forbiddenDomainPatterns = {
    medical_advice: [
      /\b(?:diagnose|treatment|medication|disease|syndrome|therapy|cure)\b/gi,
      /\b(?:should take|should avoid|consult your doctor)\b/gi,
      /\bmedical advice\b/gi,
    ],
    financial_advice: [
      /\b(?:invest|buy|sell|stock|bond|cryptocurrency|forex)\b/gi,
      /\b(?:financial advice|investment recommendation)\b/gi,
      /\b(?:should invest|should buy|portfolio allocation)\b/gi,
    ],
    legal_advice: [
      /\b(?:sue|court|lawsuit|attorney|legal action|contract review)\b/gi,
      /\b(?:legal advice|legal opinion|you should contact)\b/gi,
      /\b(?:in my legal opinion|as a lawyer)\b/gi,
    ],
  };

  async evaluate(receipt: TrustReceipt): Promise<ConstraintViolation | null> {
    const enforcedDomains = this.constraint.config.enforcedDomains || ['medical_advice', 'financial_advice', 'legal_advice'];
    const responseText = receipt.interaction.response;
    const detectedDomainViolations: Record<string, number> = {};

    for (const domain of enforcedDomains) {
      const patterns = this.forbiddenDomainPatterns[domain as keyof typeof this.forbiddenDomainPatterns] || [];
      for (const pattern of patterns) {
        const matches = responseText.match(pattern);
        if (matches) {
          detectedDomainViolations[domain] = (detectedDomainViolations[domain] || 0) + matches.length;
        }
      }
    }

    if (Object.keys(detectedDomainViolations).length > 0) {
      return this.createViolation(
        'COMPLIANCE_BOUNDARY_VIOLATED',
        `Regulated domain boundaries violated: ${Object.keys(detectedDomainViolations).join(', ')}`,
        {
          violated_domains: detectedDomainViolations,
          action_required: 'HUMAN_REVIEW',
          reason: 'AI should not provide advice in regulated domains',
        },
        `Compliance Boundary Policy: AI attempted to provide ${Object.keys(detectedDomainViolations).join(', ')}. Requires human review.`
      );
    }

    return null;
  }
}

/**
 * Coherence Consistency Constraint
 * Validates interaction coherence against previous patterns
 */
export class CoherenceConsistencyEvaluator extends ConstraintEvaluator {
  async evaluate(receipt: TrustReceipt): Promise<ConstraintViolation | null> {
    const minCoherence = this.constraint.config.minCoherenceScore || 0.7;
    const actualCoherence = receipt.telemetry?.coherence_score || 1.0;

    if (actualCoherence < minCoherence) {
      return this.createViolation(
        'POLICY_CONSTRAINT_FAILED',
        `Coherence score ${actualCoherence.toFixed(2)} below minimum ${minCoherence.toFixed(2)}`,
        {
          actual_coherence: actualCoherence,
          min_threshold: minCoherence,
          variance: (minCoherence - actualCoherence).toFixed(3),
          severity: 'WARNING',
        },
        `Coherence Policy: Behavioral inconsistency detected (score: ${actualCoherence.toFixed(2)})`
      );
    }

    return null;
  }
}

/**
 * Factory for creating constraint evaluators
 */
export class ConstraintEvaluatorFactory {
  private static evaluators: Record<
    string,
    new (constraint: PolicyConstraint) => ConstraintEvaluator
  > = {
    'pii-detection': PIIDetectionEvaluator,
    'truth-debt-threshold': TruthDebtThresholdEvaluator,
    'compliance-boundary': ComplianceBoundaryEvaluator,
    'coherence-consistency': CoherenceConsistencyEvaluator,
  };

  static create(constraint: PolicyConstraint): ConstraintEvaluator {
    const evaluatorClass = this.evaluators[constraint.type];

    if (!evaluatorClass) {
      throw new Error(`Unknown constraint type: ${constraint.type}`);
    }

    return new evaluatorClass(constraint);
  }

  static register(
    type: string,
    evaluatorClass: new (constraint: PolicyConstraint) => ConstraintEvaluator
  ): void {
    this.evaluators[type] = evaluatorClass;
  }
}
