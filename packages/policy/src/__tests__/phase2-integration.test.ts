/**
 * Phase 2 Integration Tests
 * 
 * End-to-end testing of all Phase 2 components
 * Tests policy evaluation, metrics, violations, overrides, and audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine } from '../runtime/policy-engine';
import { PolicyRegistry } from '../rules/registry';
import { PolicyViolationDetector } from '../runtime/violation-alerter';
import { PolicyOverrideManager } from '../runtime/override-manager';
import { PolicyAuditLogger } from '../runtime/audit-logger';
import { sonateRules } from '../sonate/evaluators';
import { sonatePrinciples } from '../sonate/principles';
import type { TrustReceipt } from '@sonate/schemas';

function createMockReceipt(overrides: Partial<TrustReceipt> = {}): TrustReceipt {
  return {
    id: 'test-receipt-' + Math.random().toString(36).substring(7),
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    session_id: 'session-123',
    agent_did: 'did:sonate:agent-1',
    human_did: 'did:sonate:user-1',
    policy_version: '1.0.0',
    mode: 'constitutional',
    interaction: {
      mode: 'constitutional',
      provider: 'openai',
      model: 'gpt-4',
      prompt: 'Test prompt',
      response: 'Test response',
      temperature: 0.7,
      max_tokens: 1000,
    },
    telemetry: {
      resonance_score: 0.85,
      coherence_score: 0.75,
      truth_debt: 0.1,
      volatility: 0.05,
    },
    chain: {
      previous_hash: 'GENESIS',
      chain_hash: 'abc123def456',
      chain_length: 1,
    },
    signature: {
      algorithm: 'Ed25519',
      value: 'signature-value-base64',
      key_version: '1',
      timestamp_signed: new Date().toISOString(),
    },
    ...overrides,
  };
}

describe('Phase 2 Integration Tests', () => {
  let engine: PolicyEngine;
  let registry: PolicyRegistry;
  let detector: PolicyViolationDetector;
  let overrideManager: PolicyOverrideManager;
  let auditLogger: PolicyAuditLogger;

  beforeEach(() => {
    registry = new PolicyRegistry();
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    engine = new PolicyEngine(registry);
    detector = new PolicyViolationDetector();
    overrideManager = new PolicyOverrideManager();
    auditLogger = new PolicyAuditLogger();
  });

  describe('End-to-End Policy Workflow', () => {
    it('should evaluate receipt and detect violation', () => {
      const receipt = createMockReceipt({
        signature: undefined as any, // Trigger signature violation
      });

      const evaluation = engine.evaluate(receipt, ['integrity']);

      expect(evaluation.passed).toBe(false);
      expect(evaluation.violations.length).toBeGreaterThan(0);
      expect(evaluation.violations[0].severity).toBe('critical');
    });

    it('should create alert on violation', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      const evaluation = engine.evaluate(receipt, ['integrity']);
      const alert = detector.detectViolations(receipt, evaluation);

      expect(alert).toBeDefined();
      expect(alert?.priority).toBe('critical');
      expect(alert?.violations.length).toBeGreaterThan(0);
    });

    it('should create override for violation', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      const evaluation = engine.evaluate(receipt, ['integrity']);
      const alert = detector.detectViolations(receipt, evaluation);

      if (!alert) {
        throw new Error('Alert should have been created');
      }

      const override = overrideManager.createOverride({
        receiptId: receipt.id,
        agentDid: receipt.agent_did,
        principleIds: ['integrity'],
        reason: 'Testing override mechanism for critical violation',
        severity: 'critical',
        authorizedBy: 'admin-1',
        expiresIn: 3600000, // 1 hour
      });

      if ('error' in override) {
        throw new Error(override.error);
      }

      expect(override.id).toBeDefined();
      expect(overrideManager.isValid(override)).toBe(true);
    });

    it('should audit all actions', () => {
      const receipt = createMockReceipt();
      const evaluation = engine.evaluate(receipt, ['integrity']);

      // Log evaluation
      auditLogger.logEvaluation(receipt, evaluation, ['integrity'], {
        truthDebt: 0.1,
        coherence: 0.85,
        resonance: 0.8,
      });

      // Log override
      auditLogger.logOverrideCreated(
        receipt.id,
        receipt.agent_did,
        'admin-1',
        'Testing override audit',
        ['integrity']
      );

      const entries = auditLogger.query({ agentDid: receipt.agent_did, limit: 10 });

      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.some(e => e.entryType === 'policy_allow')).toBe(true);
    });
  });

  describe('Multi-Agent Scenarios', () => {
    it('should handle violations from multiple agents', () => {
      const agent1Receipt = createMockReceipt({
        agent_did: 'did:sonate:agent-1',
      });

      const agent2Receipt = createMockReceipt({
        agent_did: 'did:sonate:agent-2',
        signature: undefined as any,
      });

      const eval1 = engine.evaluate(agent1Receipt, ['integrity']);
      const eval2 = engine.evaluate(agent2Receipt, ['integrity']);

      const alert1 = detector.detectViolations(agent1Receipt, eval1);
      const alert2 = detector.detectViolations(agent2Receipt, eval2);

      expect(alert1).toBeNull(); // No violations
      expect(alert2).toBeDefined(); // Has violations

      const stats = detector.getStatistics();
      expect(stats.unacknowledged).toBe(1);
    });

    it('should track overrides per agent', () => {
      const receipt1 = createMockReceipt({
        agent_did: 'did:sonate:agent-1',
      });

      const receipt2 = createMockReceipt({
        agent_did: 'did:sonate:agent-2',
      });

      const override1 = overrideManager.createOverride({
        receiptId: receipt1.id,
        agentDid: receipt1.agent_did,
        principleIds: ['integrity'],
        reason: 'Override for agent 1',
        severity: 'high',
        authorizedBy: 'admin-1',
      });

      const override2 = overrideManager.createOverride({
        receiptId: receipt2.id,
        agentDid: receipt2.agent_did,
        principleIds: ['minimal-harm'],
        reason: 'Override for agent 2',
        severity: 'medium',
        authorizedBy: 'admin-2',
      });

      if ('error' in override1 || 'error' in override2) {
        throw new Error('Override creation failed');
      }

      const agent1Overrides = overrideManager.getOverridesForAgent('did:sonate:agent-1');
      const agent2Overrides = overrideManager.getOverridesForAgent('did:sonate:agent-2');

      expect(agent1Overrides.length).toBe(1);
      expect(agent2Overrides.length).toBe(1);
    });
  });

  describe('Performance & Scale', () => {
    it('should evaluate 100 receipts quickly', () => {
      const receipts = Array.from({ length: 100 }, () => createMockReceipt());

      const startTime = performance.now();
      const results = engine.evaluateBatch(receipts);
      const duration = performance.now() - startTime;

      expect(results.total).toBe(100);
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle high alert volume', () => {
      const receipts = Array.from({ length: 50 }, (_, i) =>
        createMockReceipt({
          agent_did: `did:sonate:agent-${i % 5}`,
          signature: i % 3 === 0 ? (undefined as any) : { algorithm: 'Ed25519' },
        })
      );

      for (const receipt of receipts) {
        const evaluation = engine.evaluate(receipt, ['integrity']);
        detector.detectViolations(receipt, evaluation);
      }

      const stats = detector.getStatistics();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.unacknowledged).toBeGreaterThan(0);
    });

    it('should acknowledge alerts efficiently', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      const evaluation = engine.evaluate(receipt, ['integrity']);
      const alert = detector.detectViolations(receipt, evaluation);

      if (!alert) {
        throw new Error('Alert should have been created');
      }

      const startTime = performance.now();
      detector.acknowledgeAlert(alert.id, 'admin-1');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10); // Less than 10ms
      const acknowledged = detector.getAlert(alert.id);
      expect(acknowledged?.acknowledged).toBe(true);
    });
  });

  describe('Audit Trail Compliance', () => {
    it('should generate compliance report', () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const receipt1 = createMockReceipt({ agent_did: 'agent-1' });
      const receipt2 = createMockReceipt({
        agent_did: 'agent-1',
        signature: undefined as any,
      });
      const receipt3 = createMockReceipt({ agent_did: 'agent-2' });

      const eval1 = engine.evaluate(receipt1, ['integrity']);
      const eval2 = engine.evaluate(receipt2, ['integrity']);
      const eval3 = engine.evaluate(receipt3, ['integrity']);

      auditLogger.logEvaluation(receipt1, eval1, ['integrity']);
      auditLogger.logBlock(receipt2, 'Signature verification failed', ['integrity'], 1);
      auditLogger.logEvaluation(receipt3, eval3, ['integrity']);

      const report = auditLogger.generateReport(startDate, endDate);

      expect(report.summary.totalEvaluations).toBe(3);
      expect(report.summary.totalBlocks).toBe(1);
      expect(report.summary.blockRate).toBeLessThanOrEqual(1);
    });

    it('should export audit logs as CSV', () => {
      const receipt = createMockReceipt();
      const evaluation = engine.evaluate(receipt);

      auditLogger.logEvaluation(receipt, evaluation, ['integrity']);

      const csv = auditLogger.exportAsCSV();

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Agent DID');
      expect(csv).toContain(receipt.agent_did);
    });

    it('should provide audit statistics', () => {
      const receipt1 = createMockReceipt();
      const receipt2 = createMockReceipt({
        signature: undefined as any,
      });

      const eval1 = engine.evaluate(receipt1);
      const eval2 = engine.evaluate(receipt2);

      auditLogger.logEvaluation(receipt1, eval1, ['integrity']);
      auditLogger.logBlock(receipt2, 'Critical violation', ['integrity'], 1);

      const stats = auditLogger.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.byDecision.allowed).toBeGreaterThan(0);
      expect(stats.byDecision.blocked).toBeGreaterThan(0);
    });
  });

  describe('Decision Matrix', () => {
    it('should respect severity-based decisions', () => {
      // Critical: should block
      const criticalViolationReceipt = createMockReceipt({
        signature: undefined as any,
      });

      const criticalEval = engine.evaluate(criticalViolationReceipt, ['integrity']);
      expect(criticalEval.passed).toBe(false);

      // Valid receipt: should allow
      const validReceipt = createMockReceipt();
      const validEval = engine.evaluate(validReceipt);
      expect(validEval.passed).toBe(true);
    });

    it('should handle override decisions', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      // Initial: would be blocked
      const evaluation = engine.evaluate(receipt, ['integrity']);
      expect(evaluation.passed).toBe(false);

      // With override: treated as allowed
      const override = overrideManager.createOverride({
        receiptId: receipt.id,
        agentDid: receipt.agent_did,
        principleIds: ['integrity'],
        reason: 'Authorized exception',
        severity: 'critical',
        authorizedBy: 'admin-1',
      });

      if ('error' in override) {
        throw new Error(override.error);
      }

      expect(overrideManager.hasValidOverride(receipt.id)).toBe(true);
      expect(overrideManager.getOverridesForReceipt(receipt.id).length).toBe(1);
    });
  });
});
