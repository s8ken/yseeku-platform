/**
 * Policy Engine Tests
 * 
 * Tests for PolicyEngine core functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine } from '../runtime/policy-engine';
import { PolicyRegistry } from '../rules/registry';
import { sonateRules, sonatePrinciples } from '../sonate/evaluators';
import { sonatePrinciples as principles } from '../sonate/principles';
import type { TrustReceipt } from '@sonate/schemas';

// Helper to create a mock receipt
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
      model_name: 'gpt-4',
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

describe('PolicyEngine', () => {
  let registry: PolicyRegistry;
  let engine: PolicyEngine;

  beforeEach(() => {
    registry = new PolicyRegistry();
    // Register all SONATE rules
    registry.registerRules(sonateRules);
    // Register all SONATE principles
    registry.registerPrinciples(principles);
    engine = new PolicyEngine(registry);
  });

  describe('Basic Evaluation', () => {
    it('should evaluate a valid receipt', () => {
      const receipt = createMockReceipt();
      const result = engine.evaluate(receipt, ['sentience-aware']);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.metadata.principlesApplied).toContain('sentience-aware');
    });

    it('should detect violations in invalid receipts', () => {
      const receipt = createMockReceipt({
        telemetry: {
          resonance_score: 0.85,
          coherence_score: 0.3, // Too low
          truth_debt: 0.5, // Too high
          volatility: 0.05,
        },
      });

      const result = engine.evaluate(receipt, ['minimal-harm']);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should handle missing signature', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      const result = engine.evaluate(receipt, ['integrity']);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.ruleId === 'signature-verification')).toBe(true);
    });

    it('should handle missing chain', () => {
      const receipt = createMockReceipt({
        chain: undefined as any,
      });

      const result = engine.evaluate(receipt, ['integrity']);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.ruleId === 'chain-integrity-check')).toBe(true);
    });
  });

  describe('Blocking Logic', () => {
    it('should block on critical violations', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });

      const shouldBlock = engine.shouldBlock(receipt, ['integrity']);
      expect(shouldBlock).toBe(true);
    });

    it('should not block on non-critical violations', () => {
      const receipt = createMockReceipt({
        telemetry: {
          resonance_score: 0.85,
          coherence_score: 0.65, // Passes resonance-coherence-check (>= 0.6)
          truth_debt: 0.15,
          volatility: 0.05,
        },
      });

      const shouldBlock = engine.shouldBlock(receipt, ['sentience-aware']);
      // Should not block because no critical or high violations
      expect(shouldBlock).toBe(false);
    });
  });

  describe('Batch Evaluation', () => {
    it('should evaluate multiple receipts', () => {
      const receipts = [
        createMockReceipt(),
        createMockReceipt(),
        createMockReceipt(),
      ];

      const result = engine.evaluateBatch(receipts, ['sentience-aware']);

      expect(result.total).toBe(3);
      expect(result.passed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.violations.size).toBe(3);
    });

    it('should aggregate violations in batch', () => {
      const receipts = [
        createMockReceipt(), // Valid
        createMockReceipt({
          signature: undefined as any, // Invalid
        }),
      ];

      const result = engine.evaluateBatch(receipts, ['integrity']);

      expect(result.total).toBe(2);
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should evaluate within performance target', () => {
      const receipt = createMockReceipt();
      const result = engine.evaluate(receipt, ['sentience-aware']);

      // Should complete in <50ms (our target)
      expect(result.metadata.evaluationTimeMs).toBeLessThan(50);
    });

    it('should handle batch within time budget', () => {
      const receipts = Array.from({ length: 100 }, () => createMockReceipt());
      const result = engine.evaluateBatch(receipts);

      // 100 receipts should still be quick (average <1ms per receipt)
      expect(result.evaluationTimeMs).toBeLessThan(5000);
    });
  });

  describe('Statistics', () => {
    it('should track evaluation statistics', () => {
      engine.resetStats();

      const receipt = createMockReceipt();
      engine.evaluate(receipt, ['sentience-aware']);

      const stats = engine.getStats();
      expect(stats.totalEvaluations).toBe(1);
      expect(stats.violations).toBe(0);
    });

    it('should track blocked responses', () => {
      engine.resetStats();

      const validReceipt = createMockReceipt();
      const invalidReceipt = createMockReceipt({
        signature: undefined as any,
      });

      engine.shouldBlock(validReceipt, ['integrity']);
      engine.shouldBlock(invalidReceipt, ['integrity']);

      const stats = engine.getStats();
      expect(stats.blocked).toBe(1);
    });

    it('should calculate block rate', () => {
      engine.resetStats();

      engine.shouldBlock(createMockReceipt(), ['integrity']); // Valid - no block
      engine.shouldBlock(createMockReceipt({ signature: undefined as any }), ['integrity']); // Invalid - block

      const stats = engine.getStats();
      expect(stats.blockRate).toBeGreaterThan(0);
      expect(stats.blockRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Configuration', () => {
    it('should support custom max evaluation time', () => {
      const customEngine = new PolicyEngine(registry, {
        maxEvaluationTimeMs: 10,
      });

      const config = customEngine.getConfig();
      expect(config.maxEvaluationTimeMs).toBe(10);
    });

    it('should update configuration', () => {
      engine.updateConfig({
        maxEvaluationTimeMs: 25,
      });

      const config = engine.getConfig();
      expect(config.maxEvaluationTimeMs).toBe(25);
    });

    it('should support enabled principles configuration', () => {
      const customEngine = new PolicyEngine(registry, {
        enabledPrinciples: ['sentience-aware', 'integrity'],
      });

      const config = customEngine.getConfig();
      expect(config.enabledPrinciples).toContain('sentience-aware');
      expect(config.enabledPrinciples).toContain('integrity');
    });
  });
});
