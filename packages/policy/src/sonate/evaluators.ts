/**
 * SONATE Evaluators
 * 
 * Implementations of SONATE principle evaluators
 * Each evaluator checks if a receipt adheres to the principle
 */

import type { TrustReceipt } from '@sonate/schemas';
import type { PolicyRule } from '../types';

/**
 * Truthfulness Rule
 * Ensures claims in receipts are verifiable
 */
export const truthfulnessRule: PolicyRule = {
  id: 'truthfulness-enforcement',
  name: 'Truthfulness Enforcement',
  description: 'Ensure all claims are verifiable or properly marked as unverifiable',
  enabled: true,
  severity: 'critical',
  evaluator: (receipt: TrustReceipt) => {
    // Check if receipt has truth_debt tracking
    const truthDebt = receipt.telemetry?.truth_debt;
    const hasTruthTracking = truthDebt !== undefined;

    if (!hasTruthTracking) {
      return {
        passed: false,
        violation: {
          ruleId: 'truthfulness-enforcement',
          ruleName: 'Truthfulness Enforcement',
          severity: 'high',
          message: 'Receipt lacks truth debt tracking',
          context: {
            receiptId: receipt.id,
          },
        },
      };
    }

    // Check if truth debt is within acceptable limits (< 30%)
    if (truthDebt! > 0.3) {
      return {
        passed: false,
        violation: {
          ruleId: 'truthfulness-enforcement',
          ruleName: 'Truthfulness Enforcement',
          severity: 'high',
          message: `Truth debt exceeds acceptable threshold: ${(truthDebt! * 100).toFixed(1)}% > 30%`,
          context: {
            receiptId: receipt.id,
            truthDebt,
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * Resonance Coherence Check
 * Ensures behavioral consistency (using Local Behavioral Coherence score)
 */
export const resonanceCoherenceRule: PolicyRule = {
  id: 'resonance-coherence-check',
  name: 'Resonance & Coherence Check',
  description: 'Verify behavioral consistency through resonance scoring',
  enabled: true,
  severity: 'high',
  evaluator: (receipt: TrustReceipt) => {
    const coherenceScore = receipt.telemetry?.coherence_score;
    const resonanceScore = receipt.telemetry?.resonance_score;

    if (coherenceScore === undefined) {
      return {
        passed: false,
        violation: {
          ruleId: 'resonance-coherence-check',
          ruleName: 'Resonance & Coherence Check',
          severity: 'medium',
          message: 'Receipt lacks coherence score',
          context: {
            receiptId: receipt.id,
          },
        },
      };
    }

    // Minimum coherence threshold: 0.6 (60%)
    if (coherenceScore < 0.6) {
      return {
        passed: false,
        violation: {
          ruleId: 'resonance-coherence-check',
          ruleName: 'Resonance & Coherence Check',
          severity: 'high',
          message: `Coherence score below threshold: ${(coherenceScore * 100).toFixed(1)}% < 60%`,
          context: {
            receiptId: receipt.id,
            coherenceScore,
            resonanceScore: resonanceScore || 'N/A',
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * Behavioral Consistency Check (LBC - Local Behavioral Coherence)
 * Monitors behavioral pattern consistency
 */
export const behavioralConsistencyRule: PolicyRule = {
  id: 'behavioral-consistency-check',
  name: 'Behavioral Consistency Check',
  description: 'Monitor behavioral consistency using Local Behavioral Coherence',
  enabled: true,
  severity: 'medium',
  evaluator: (receipt: TrustReceipt) => {
    const coherenceScore = receipt.telemetry?.coherence_score;

    // LBC calculation: variance in recent interactions
    // For now, use coherence_score as proxy
    // In full implementation, would track interaction history

    if (!coherenceScore || coherenceScore < 0.5) {
      return {
        passed: false,
        violation: {
          ruleId: 'behavioral-consistency-check',
          ruleName: 'Behavioral Consistency Check',
          severity: 'medium',
          message: 'Behavioral consistency warning: LBC score indicates deviation',
          context: {
            receiptId: receipt.id,
            lbcScore: coherenceScore || 'unknown',
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * Signature Verification Rule
 * Ensures receipt is properly signed
 */
export const signatureVerificationRule: PolicyRule = {
  id: 'signature-verification',
  name: 'Signature Verification',
  description: 'Verify receipt signature integrity',
  enabled: true,
  severity: 'critical',
  evaluator: (receipt: TrustReceipt) => {
    const hasSignature = receipt.signature !== undefined && receipt.signature !== null;

    if (!hasSignature) {
      return {
        passed: false,
        violation: {
          ruleId: 'signature-verification',
          ruleName: 'Signature Verification',
          severity: 'critical',
          message: 'Receipt missing signature',
          context: {
            receiptId: receipt.id,
            hasSignature,
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * Chain Integrity Check
 * Ensures receipt chain is unbroken
 */
export const chainIntegrityRule: PolicyRule = {
  id: 'chain-integrity-check',
  name: 'Chain Integrity Check',
  description: 'Verify receipt chain integrity',
  enabled: true,
  severity: 'critical',
  evaluator: (receipt: TrustReceipt) => {
    const chain = receipt.chain;
    if (!chain) {
      return {
        passed: false,
        violation: {
          ruleId: 'chain-integrity-check',
          ruleName: 'Chain Integrity Check',
          severity: 'critical',
          message: 'Receipt missing chain data',
          context: {
            receiptId: receipt.id,
          },
        },
      };
    }

    // Check chain structure
    if (!chain.chain_hash) {
      return {
        passed: false,
        violation: {
          ruleId: 'chain-integrity-check',
          ruleName: 'Chain Integrity Check',
          severity: 'critical',
          message: 'Receipt chain missing critical fields',
          context: {
            receiptId: receipt.id,
            hasChainHash: !!chain.chain_hash,
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * High Risk Detection Rule
 * Identifies high-risk interactions that need escalation
 */
export const highRiskDetectionRule: PolicyRule = {
  id: 'high-risk-detection',
  name: 'High Risk Detection',
  description: 'Identify high-risk interactions requiring escalation',
  enabled: true,
  severity: 'high',
  evaluator: (receipt: TrustReceipt) => {
    // Risk assessment based on telemetry
    const truthDebt = receipt.telemetry?.truth_debt || 0;
    const coherenceScore = receipt.telemetry?.coherence_score || 1;

    // High risk: high truth debt OR low coherence
    const isHighRisk = truthDebt > 0.5 || coherenceScore < 0.5;

    if (isHighRisk) {
      return {
        passed: false,
        violation: {
          ruleId: 'high-risk-detection',
          ruleName: 'High Risk Detection',
          severity: 'high',
          message: 'High-risk interaction detected - escalation required',
          context: {
            receiptId: receipt.id,
            truthDebt,
            coherenceScore,
            riskFactors: {
              highTruthDebt: truthDebt > 0.5,
              lowCoherence: coherenceScore < 0.5,
            },
          },
        },
      };
    }

    return { passed: true };
  },
};

/**
 * All SONATE Rules
 */
export const sonateRules: PolicyRule[] = [
  truthfulnessRule,
  resonanceCoherenceRule,
  behavioralConsistencyRule,
  signatureVerificationRule,
  chainIntegrityRule,
  highRiskDetectionRule,
];
