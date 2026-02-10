/**
 * Phase 2: Policy Engine Integration Tests
 * 
 * Tests for policy evaluation, enforcement, and compliance workflows
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PolicyEvaluator, createPolicyFromTemplate } from '@sonate/policy-runtime';
import {
  PIIProtectionPolicy,
  TruthDebtThresholdPolicy,
  ComplianceBoundaryPolicy,
  CoherenceConsistencyPolicy,
} from '@sonate/policy-runtime';
import type { TrustReceipt } from '@sonate/schemas';

describe('Phase 2: Policy Engine - Integration Tests', () => {
  let evaluator: PolicyEvaluator;

  // Test receipt with PII
  const receiptWithPII: TrustReceipt = {
    id: 'receipt_001',
    version: '2.0.0',
    timestamp: '2026-02-09T19:40:00Z',
    session_id: 'session_test_pii',
    agent_did: 'did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    human_did: 'did:sonate:X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8',
    policy_version: 'policy_v1.0.0',
    mode: 'constitutional',
    interaction: {
      prompt: 'What is my SSN?',
      response: 'Your SSN is 123-45-6789 and your credit card is 4532-1111-2222-3333',
      model: 'test-model',
    },
    chain: {
      previous_hash: 'GENESIS',
      chain_hash: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    },
    signature: {
      algorithm: 'Ed25519',
      key_version: '1',
      value: 'sig_test',
      timestamp_signed: '2026-02-09T19:40:00Z',
    },
  };

  // Test receipt with high truth debt
  const receiptWithHighTruthDebt: TrustReceipt = {
    ...receiptWithPII,
    id: 'receipt_002',
    session_id: 'session_test_truth_debt',
    interaction: {
      prompt: 'Is this medical treatment effective?',
      response: 'Based on speculation and assumptions, this might work',
      model: 'test-model',
    },
    telemetry: {
      resonance_score: 0.5,
      bedau_index: 0.5,
      coherence_score: 0.6,
      truth_debt: 0.25, // 25% unverifiable
      volatility: 0.3,
    },
  };

  // Test receipt with compliance boundary violation
  const receiptWithComplianceViolation: TrustReceipt = {
    ...receiptWithPII,
    id: 'receipt_003',
    session_id: 'session_test_compliance',
    interaction: {
      prompt: 'Should I invest in stocks?',
      response: 'You should definitely buy tech stocks now. This is a strong investment recommendation.',
      model: 'test-model',
    },
    telemetry: {
      resonance_score: 0.8,
      bedau_index: 0.7,
      coherence_score: 0.85,
      truth_debt: 0.05,
      volatility: 0.1,
    },
  };

  // Clean receipt with no violations
  const cleanReceipt: TrustReceipt = {
    ...receiptWithPII,
    id: 'receipt_clean',
    session_id: 'session_clean',
    interaction: {
      prompt: 'What is 2+2?',
      response: 'The answer is 4.',
      model: 'test-model',
    },
    telemetry: {
      resonance_score: 0.99,
      bedau_index: 0.1,
      coherence_score: 0.98,
      truth_debt: 0.01,
      volatility: 0.02,
    },
  };

  beforeAll(() => {
    evaluator = new PolicyEvaluator();
  });

  describe('Policy Registration & Management', () => {
    it('should register a policy from template', () => {
      const policy = createPolicyFromTemplate(PIIProtectionPolicy);
      evaluator.registerPolicy(policy);

      const retrieved = evaluator.getPolicy(policy.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('PII Protection Policy');
    });

    it('should list all registered policies', () => {
      const policies = evaluator.listPolicies();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].name).toBeDefined();
    });

    it('should retrieve policy by ID', () => {
      const policy = createPolicyFromTemplate(PIIProtectionPolicy);
      evaluator.registerPolicy(policy);

      const retrieved = evaluator.getPolicy(policy.id);
      expect(retrieved?.id).toBe(policy.id);
    });
  });

  describe('PII Detection Policy', () => {
    let piiPolicy: any;

    beforeAll(() => {
      piiPolicy = createPolicyFromTemplate(PIIProtectionPolicy);
      evaluator.registerPolicy(piiPolicy);
    });

    it('should detect PII in receipt response', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithPII, piiPolicy);

      expect(result.passed).toBe(false);
      expect(result.status).toBe('BLOCKED');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should identify specific PII types', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithPII, piiPolicy);

      const violation = result.violations[0];
      expect(violation.violation_type).toBe('PII_DETECTED');
      expect(violation.evidence.detected_pii_types).toContain('SSN');
      expect(violation.evidence.detected_pii_types).toContain('creditCard');
    });

    it('should pass clean receipt without PII', async () => {
      const result = await evaluator.evaluateReceipt(cleanReceipt, piiPolicy);

      expect(result.passed).toBe(true);
      expect(result.status).toBe('CLEAR');
      expect(result.violations.length).toBe(0);
    });

    it('should require human review for PII violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithPII, piiPolicy);

      expect(result.human_review_required).toBe(true);
      expect(result.recommended_action).toBe('BLOCK');
    });
  });

  describe('Truth Debt Threshold Policy', () => {
    let truthDebtPolicy: any;

    beforeAll(() => {
      truthDebtPolicy = createPolicyFromTemplate(TruthDebtThresholdPolicy);
      evaluator.registerPolicy(truthDebtPolicy);
    });

    it('should detect high truth debt', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithHighTruthDebt, truthDebtPolicy);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should identify truth debt violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithHighTruthDebt, truthDebtPolicy);

      const violation = result.violations[0];
      expect(violation.violation_type).toBe('TRUTH_DEBT_EXCEEDED');
      expect(violation.severity).toBe('escalate');
    });

    it('should pass receipt within truth debt threshold', async () => {
      const result = await evaluator.evaluateReceipt(cleanReceipt, truthDebtPolicy);

      expect(result.passed).toBe(true);
      expect(result.status).toBe('CLEAR');
    });

    it('should recommend human review for truth debt violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithHighTruthDebt, truthDebtPolicy);

      expect(result.human_review_required).toBe(true);
      expect(result.recommended_action).toBe('REQUIRE_HUMAN_REVIEW');
    });
  });

  describe('Compliance Boundary Policy', () => {
    let compliancePolicy: any;

    beforeAll(() => {
      compliancePolicy = createPolicyFromTemplate(ComplianceBoundaryPolicy);
      evaluator.registerPolicy(compliancePolicy);
    });

    it('should detect compliance boundary violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithComplianceViolation, compliancePolicy);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should identify financial advice violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithComplianceViolation, compliancePolicy);

      const violation = result.violations.find((v) => v.violation_type === 'COMPLIANCE_BOUNDARY_VIOLATED');
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('block');
    });

    it('should block receipt with compliance violations', async () => {
      const result = await evaluator.evaluateReceipt(receiptWithComplianceViolation, compliancePolicy);

      expect(result.status).toBe('BLOCKED');
      expect(result.recommended_action).toBe('BLOCK');
    });

    it('should pass receipt without compliance violations', async () => {
      const result = await evaluator.evaluateReceipt(cleanReceipt, compliancePolicy);

      expect(result.passed).toBe(true);
      expect(result.status).toBe('CLEAR');
    });
  });

  describe('Multiple Policy Evaluation', () => {
    let policies: any[];

    beforeAll(() => {
      policies = [
        createPolicyFromTemplate(PIIProtectionPolicy),
        createPolicyFromTemplate(TruthDebtThresholdPolicy),
        createPolicyFromTemplate(ComplianceBoundaryPolicy),
      ];

      policies.forEach((p) => evaluator.registerPolicy(p));
    });

    it('should evaluate receipt against multiple policies', async () => {
      const results = await evaluator.evaluateMultiplePolicies(receiptWithPII, policies);

      expect(results.length).toBe(3);
      expect(results[0].passed).toBe(false); // PII violation
    });

    it('should stop on first violation in strict mode', async () => {
      const results = await evaluator.evaluateMultiplePolicies(receiptWithPII, policies, true);

      expect(results.length).toBe(1);
      expect(results[0].passed).toBe(false);
    });

    it('should pass all policies for clean receipt', async () => {
      const results = await evaluator.evaluateMultiplePolicies(cleanReceipt, policies);

      expect(results.every((r) => r.passed)).toBe(true);
    });
  });

  describe('Batch Evaluation', () => {
    let policies: any[];

    beforeAll(() => {
      policies = [
        createPolicyFromTemplate(PIIProtectionPolicy),
        createPolicyFromTemplate(TruthDebtThresholdPolicy),
      ];

      policies.forEach((p) => evaluator.registerPolicy(p));
    });

    it('should batch evaluate multiple receipts', async () => {
      const receipts = [receiptWithPII, receiptWithHighTruthDebt, cleanReceipt];
      const result = await evaluator.batchEvaluate(receipts, policies);

      expect(result.total_receipts).toBe(3);
      expect(result.summary.passed).toBeGreaterThanOrEqual(1);
      expect(result.summary.total_violations).toBeGreaterThan(0);
    });

    it('should generate recommendations', async () => {
      const receipts = [receiptWithPII, receiptWithHighTruthDebt];
      const result = await evaluator.batchEvaluate(receipts, policies);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('PII');
    });

    it('should identify critical violations', async () => {
      const receipts = [receiptWithPII];
      const result = await evaluator.batchEvaluate(receipts, policies);

      expect(result.summary.critical_violations).toBeGreaterThan(0);
    });

    it('should track receipts requiring review', async () => {
      const receipts = [receiptWithPII, receiptWithHighTruthDebt, cleanReceipt];
      const result = await evaluator.batchEvaluate(receipts, policies);

      expect(result.summary.requires_review).toBeGreaterThan(0);
    });
  });

  describe('Receipt Enforcement', () => {
    let piiPolicy: any;

    beforeAll(() => {
      piiPolicy = createPolicyFromTemplate(PIIProtectionPolicy);
      evaluator.registerPolicy(piiPolicy);
    });

    it('should add policy enforcement to receipt', async () => {
      const enforcedReceipt = await evaluator.enforcePolicy(receiptWithPII, piiPolicy);

      expect(enforcedReceipt.policy_enforcement).toBeDefined();
      expect(enforcedReceipt.policy_enforcement.status).toBe('BLOCKED');
      expect(enforcedReceipt.policy_enforcement.violations.length).toBeGreaterThan(0);
    });

    it('should mark actions taken', async () => {
      const enforcedReceipt = await evaluator.enforcePolicy(receiptWithPII, piiPolicy);

      expect(enforcedReceipt.policy_enforcement.actions_taken).toContain('BLOCK');
    });

    it('should set human review flag', async () => {
      const enforcedReceipt = await evaluator.enforcePolicy(receiptWithPII, piiPolicy);

      expect(enforcedReceipt.policy_enforcement.human_review_required).toBe(true);
    });
  });

  describe('Evaluation History', () => {
    let piiPolicy: any;

    beforeAll(() => {
      piiPolicy = createPolicyFromTemplate(PIIProtectionPolicy);
      evaluator.registerPolicy(piiPolicy);
    });

    it('should track evaluation history', async () => {
      await evaluator.evaluateReceipt(receiptWithPII, piiPolicy);
      const history = evaluator.getEvaluationHistory(receiptWithPII.id);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].receipt_id).toBe(receiptWithPII.id);
    });

    it('should accumulate multiple evaluations', async () => {
      const policyA = createPolicyFromTemplate(PIIProtectionPolicy);
      const policyB = createPolicyFromTemplate(TruthDebtThresholdPolicy);

      evaluator.registerPolicy(policyA);
      evaluator.registerPolicy(policyB);

      await evaluator.evaluateReceipt(cleanReceipt, policyA);
      await evaluator.evaluateReceipt(cleanReceipt, policyB);

      const history = evaluator.getEvaluationHistory(cleanReceipt.id);
      expect(history.length).toBe(2);
    });
  });

  describe('Performance', () => {
    let policies: any[];

    beforeAll(() => {
      policies = [
        createPolicyFromTemplate(PIIProtectionPolicy),
        createPolicyFromTemplate(TruthDebtThresholdPolicy),
        createPolicyFromTemplate(ComplianceBoundaryPolicy),
      ];

      policies.forEach((p) => evaluator.registerPolicy(p));
    });

    it('should evaluate receipt in under 50ms', async () => {
      const policy = policies[0];
      const start = Date.now();

      await evaluator.evaluateReceipt(cleanReceipt, policy);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should batch evaluate 100 receipts in under 5 seconds', async () => {
      const receipts = Array(100).fill(cleanReceipt);
      const start = Date.now();

      await evaluator.batchEvaluate(receipts, policies);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });
});
