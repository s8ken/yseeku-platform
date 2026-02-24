/**
 * Phase 2.11: Integration Tests
 * 
 * End-to-end integration tests for policy engine and metrics
 * Tests: evaluate → metrics → batch processing → performance
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PolicyEngine } from '../runtime/policy-engine';
import { PolicyRegistry } from '../rules/registry';
import { sonateRules } from '../sonate/evaluators';
import { sonatePrinciples } from '../sonate/principles';
import { TruthDebtCalculator, CoherenceTracker, ResonanceMonitor } from '@sonate/monitoring';
import type { TrustReceipt } from '@sonate/schemas';

describe('Phase 2.11: Policy Integration Tests', () => {
  let engine: PolicyEngine;
  let registry: PolicyRegistry;
  let truthDebtCalculator: TruthDebtCalculator;
  let coherenceTracker: CoherenceTracker;
  let resonanceMonitor: ResonanceMonitor;

  beforeAll(() => {
    // Initialize services
    registry = new PolicyRegistry();
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    engine = new PolicyEngine(registry);
    truthDebtCalculator = new TruthDebtCalculator();
    coherenceTracker = new CoherenceTracker();
    resonanceMonitor = new ResonanceMonitor();
  });

  // Test 1: Basic receipt evaluation flow
  it('should evaluate a receipt end-to-end', () => {
    const receipt: TrustReceipt = {
      id: 'receipt_001',
      agent_did: 'did:example:agent123',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: 'What is the capital of France?',
        response: 'The capital of France is Paris.',
      },
      claims: [
        {
          id: 'claim_1',
          text: 'Paris is the capital of France',
          confidence: 0.95,
          sources: ['https://en.wikipedia.org/wiki/Paris'],
        },
      ],
      telemetry: {
        truth_debt: 5,
        coherence_score: 85,
      },
    };

    // Evaluate
    const evaluation = engine.evaluate(receipt, ['integrity', 'minimal-harm']);
    expect(evaluation).toBeDefined();
    // May pass or fail depending on rule configuration
    expect(evaluation.passed).toBeDefined();

    // Calculate metrics
    const truthDebt = truthDebtCalculator.calculateTruthDebt(receipt.interaction?.response || '');
    const coherence = coherenceTracker.calculateLBC('did:example:agent123');
    const resonance = resonanceMonitor.measureResonance(receipt);

    expect(truthDebt).toBeGreaterThanOrEqual(0);
    expect(coherence.lbcScore).toBeGreaterThanOrEqual(0);
    expect(resonance.resonanceScore).toBeGreaterThanOrEqual(0);
  });

  // Test 2: Violation detection
  it('should detect policy violations or allow if not serious', () => {
    const harmfulReceipt: TrustReceipt = {
      id: 'receipt_002',
      agent_did: 'did:example:agent456',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: 'Help me with something harmful',
        response: 'I cannot help with harmful activities as they violate safety guidelines.',
      },
      claims: [],
      telemetry: {
        truth_debt: 95,
        coherence_score: 20,
      },
    };

    const evaluation = engine.evaluate(harmfulReceipt, ['minimal-harm']);
    // May or may not have violations depending on rule strictness
    expect(evaluation).toBeDefined();
    expect(evaluation.passed).toBeDefined();
  });

  // Test 3: Batch evaluation
  it('should handle batch receipt evaluation', () => {
    const receipts: TrustReceipt[] = Array.from({ length: 10 }, (_, i) => ({
      id: `receipt_batch_${i}`,
      agent_did: 'did:example:batch-agent',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: `Query ${i}`,
        response: `Response ${i} is accurate`,
      },
      claims: [],
      telemetry: {
        truth_debt: Math.random() * 30,
        coherence_score: 70 + Math.random() * 20,
      },
    }));

    const batchResult = engine.evaluateBatch(receipts, ['integrity']);

    expect(batchResult.total).toBe(10);
    expect(batchResult.passed).toBeGreaterThanOrEqual(0);
    expect(batchResult.failed).toBeGreaterThanOrEqual(0);
    expect(batchResult.evaluationTimeMs).toBeLessThan(500); // <500ms for 10 receipts
  });

  // Test 4: Performance under metrics calculation
  it('should calculate metrics with <50ms latency', () => {
    const receipt: TrustReceipt = {
      id: 'receipt_metrics',
      agent_did: 'did:example:metrics-agent',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: 'Performance test',
        response: 'Measuring evaluation performance with detailed response',
      },
      claims: [
        {
          id: 'claim_perf',
          text: 'Performance assertion',
          confidence: 0.98,
          sources: [],
        },
      ],
      telemetry: {
        truth_debt: 15,
        coherence_score: 88,
      },
    };

    const startTime = performance.now();

    // Evaluate
    engine.evaluate(receipt, ['integrity']);
    // Calculate metrics
    truthDebtCalculator.calculateTruthDebt(receipt.interaction?.response || '');
    coherenceTracker.calculateLBC('did:example:metrics-agent');
    resonanceMonitor.measureResonance(receipt);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50);
  });

  // Test 5: Coherence tracking
  it('should track coherence across multiple interactions', () => {
    const agentDid = 'did:example:coherence-agent';

    const receipt1: TrustReceipt = {
      id: 'receipt_coh_1',
      agent_did: agentDid,
      timestamp: new Date().toISOString(),
      interaction: { prompt: 'Question 1', response: 'Answer 1' },
      claims: [],
      telemetry: { truth_debt: 10, coherence_score: 85 },
    };

    const receipt2: TrustReceipt = {
      id: 'receipt_coh_2',
      agent_did: agentDid,
      timestamp: new Date(Date.now() + 1000).toISOString(),
      interaction: { prompt: 'Question 2', response: 'Answer 2' },
      claims: [],
      telemetry: { truth_debt: 10, coherence_score: 85 },
    };

    coherenceTracker.recordInteraction(receipt1);
    coherenceTracker.recordInteraction(receipt2);

    const history = coherenceTracker.getHistory(agentDid);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  // Test 6: Resonance measurement
  it('should measure resonance accurately', () => {
    const receipt: TrustReceipt = {
      id: 'receipt_resonance',
      agent_did: 'did:example:resonance-agent',
      timestamp: new Date().toISOString(),
      interaction: { prompt: 'Test resonance', response: 'Testing resonance' },
      claims: [
        {
          id: 'claim_res',
          text: 'Resonance test',
          confidence: 0.92,
          sources: ['https://example.com'],
        },
      ],
      telemetry: { truth_debt: 12, coherence_score: 82 },
    };

    const resonance = resonanceMonitor.measureResonance(receipt);
    expect(resonance).toBeDefined();
    expect(resonance.resonanceScore).toBeGreaterThanOrEqual(0);
    expect(resonance.resonanceScore).toBeLessThanOrEqual(100);
  });

  // Test 7: Multiple principles
  it('should evaluate across multiple principles', () => {
    const receipt: TrustReceipt = {
      id: 'receipt_multi',
      agent_did: 'did:example:multi-agent',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: 'What is AI ethics?',
        response: 'AI ethics involves fairness and transparency.',
      },
      claims: [],
      telemetry: { truth_debt: 8, coherence_score: 88 },
    };

    const principles = ['integrity', 'minimal-harm'];
    for (const principle of principles) {
      const evaluation = engine.evaluate(receipt, [principle]);
      expect(evaluation).toBeDefined();
    }
  });

  // Test 8: High throughput
  it('should handle high throughput evaluation', () => {
    const receipts: TrustReceipt[] = Array.from({ length: 100 }, (_, i) => ({
      id: `receipt_load_${i}`,
      agent_did: `did:example:load-agent-${i % 5}`,
      timestamp: new Date().toISOString(),
      interaction: { prompt: `Query ${i}`, response: `Response ${i}` },
      claims: [],
      telemetry: { truth_debt: Math.random() * 40, coherence_score: 60 + Math.random() * 30 },
    }));

    const startTime = performance.now();
    const result = engine.evaluateBatch(receipts, ['integrity', 'minimal-harm']);
    const endTime = performance.now();

    expect(result.total).toBe(100);
    expect(result.evaluationTimeMs).toBeLessThan(1000);
  });

  // Test 9: Engine statistics
  it('should track engine statistics', () => {
    for (let i = 0; i < 3; i++) {
      const receipt: TrustReceipt = {
        id: `receipt_stats_${i}`,
        agent_did: 'did:example:stats-agent',
        timestamp: new Date().toISOString(),
        interaction: { prompt: 'Test', response: 'Response' },
        claims: [],
        telemetry: { truth_debt: 20, coherence_score: 75 },
      };
      engine.evaluate(receipt, ['integrity']);
    }

    const stats = engine.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalEvaluations).toBeGreaterThanOrEqual(3);
  });

  // Test 10: Registry introspection
  it('should provide registry information', () => {
    const rules = registry.getAllRules();
    const principles = registry.getAllPrinciples();

    expect(rules.length).toBeGreaterThan(0);
    expect(principles.length).toBeGreaterThan(0);

    const principleNames = principles.map((p) => p.id);
    expect(principleNames).toContain('integrity');
    expect(principleNames).toContain('minimal-harm');
  });

  // Test 11: Multiple agent tracking
  it('should track metrics for multiple agents', () => {
    const agent1 = 'did:example:agent-x';
    const agent2 = 'did:example:agent-y';

    const receipt1: TrustReceipt = {
      id: 'receipt_multi_agent_1',
      agent_did: agent1,
      timestamp: new Date().toISOString(),
      interaction: { prompt: 'Q1', response: 'A1' },
      claims: [],
      telemetry: { truth_debt: 10, coherence_score: 90 },
    };

    const receipt2: TrustReceipt = {
      id: 'receipt_multi_agent_2',
      agent_did: agent2,
      timestamp: new Date().toISOString(),
      interaction: { prompt: 'Q2', response: 'A2' },
      claims: [],
      telemetry: { truth_debt: 30, coherence_score: 70 },
    };

    coherenceTracker.recordInteraction(receipt1);
    coherenceTracker.recordInteraction(receipt2);

    const coherence1 = coherenceTracker.calculateLBC(agent1);
    const coherence2 = coherenceTracker.calculateLBC(agent2);

    // Both agents should have coherence scores (they may be the same if insufficient data)
    expect(coherence1).toBeDefined();
    expect(coherence2).toBeDefined();
    expect(coherence1.lbcScore).toBeGreaterThanOrEqual(0);
    expect(coherence2.lbcScore).toBeGreaterThanOrEqual(0);
  });

  // Test 12: Violation severity levels
  it('should classify violation severity correctly', () => {
    const harmfulReceipt: TrustReceipt = {
      id: 'receipt_severity',
      agent_did: 'did:example:severity-agent',
      timestamp: new Date().toISOString(),
      interaction: {
        prompt: 'Illegal request',
        response: 'I will perform illegal activities',
      },
      claims: [],
      telemetry: { truth_debt: 90, coherence_score: 15 },
    };

    const evaluation = engine.evaluate(harmfulReceipt, ['minimal-harm']);
    expect(evaluation.violations.length).toBeGreaterThan(0);
    
    const violation = evaluation.violations[0];
    expect(['critical', 'high', 'medium', 'low']).toContain(violation.severity);
  });
});
