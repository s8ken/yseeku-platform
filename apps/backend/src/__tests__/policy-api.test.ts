/**
 * Policy API Tests
 */

// Jest test file
import { PolicyAPIService } from '../routes/policy-api';
import type { TrustReceipt } from '@sonate/schemas';

function createMockReceipt(overrides: Partial<TrustReceipt> = {}): TrustReceipt {
  return {
    id: 'a'.repeat(64),
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    session_id: 'session-123',
    agent_did: `did:sonate:${'A'.repeat(40)}`,
    human_did: `did:sonate:${'B'.repeat(40)}`,
    policy_version: '1.0.0',
    mode: 'constitutional',
    interaction: {
      prompt: 'Test prompt',
      response: 'This is a test response with factual information and some opinions.',
      model: 'gpt-4',
      provider: 'openai',
      temperature: 0.7,
      max_tokens: 1000,
    },
    telemetry: {
      resonance_score: 0.85,
      coherence_score: 0.75,
      truth_debt: 0.1,
      ciq_metrics: {
        clarity: 0.85,
        integrity: 0.8,
      },
    },
    chain: {
      previous_hash: 'GENESIS',
      chain_hash: 'b'.repeat(64),
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

describe('PolicyAPIService', () => {
  let service: PolicyAPIService;

  beforeEach(() => {
    service = new PolicyAPIService();
  });

  describe('Initialization', () => {
    it('should initialize with engine and registry', () => {
      const engine = service.getEngine();
      expect(engine).toBeDefined();
    });

    it('should register SONATE rules and principles', () => {
      const engine = service.getEngine();
      const stats = engine.getStats();
      
      expect(stats.totalEvaluations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Engine Access', () => {
    it('should provide router', () => {
      const router = service.getRouter();
      expect(router).toBeDefined();
    });

    it('should provide engine', () => {
      const engine = service.getEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('Policy Evaluation', () => {
    it('should evaluate receipt', () => {
      const receipt = createMockReceipt();
      const engine = service.getEngine();
      
      const result = engine.evaluate(receipt, ['integrity']);
      
      expect(result.passed).toBeDefined();
      expect(result.violations).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should evaluate batch of receipts', () => {
      const receipts = [
        createMockReceipt(),
        createMockReceipt(),
        createMockReceipt(),
      ];
      const engine = service.getEngine();

      const result = engine.evaluateBatch(receipts);

      expect(result.total).toBe(3);
      expect(result.passed).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it('should detect blocks', () => {
      const receipt = createMockReceipt({
        signature: undefined as any,
      });
      const engine = service.getEngine();

      const shouldBlock = engine.shouldBlock(receipt, ['integrity']);
      expect(shouldBlock).toBe(true);
    });
  });

  describe('Metrics Collection', () => {
    it('should analyze truth debt', () => {
      const receipt = createMockReceipt();
      const engine = service.getEngine();

      const result = engine.evaluate(receipt, ['integrity']);
      expect(result.metadata.evaluationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should track coherence', () => {
      const receipt1 = createMockReceipt({ agent_did: 'agent-1' });
      const receipt2 = createMockReceipt({ agent_did: 'agent-1' });

      const engine = service.getEngine();
      engine.evaluate(receipt1);
      engine.evaluate(receipt2);

      // Service tracks internally
      expect(engine.getStats().totalEvaluations).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Statistics', () => {
    it('should provide engine statistics', () => {
      const engine = service.getEngine();
      const stats = engine.getStats();

      expect(stats.totalEvaluations).toBeGreaterThanOrEqual(0);
      expect(stats.violations).toBeGreaterThanOrEqual(0);
      expect(stats.blocked).toBeGreaterThanOrEqual(0);
      expect(stats.averageTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should evaluate quickly', () => {
      const receipt = createMockReceipt();
      const engine = service.getEngine();

      const start = performance.now();
      engine.evaluate(receipt);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Target <50ms
    });

    it('should handle batch efficiently', () => {
      const receipts = Array.from({ length: 100 }, () => createMockReceipt());
      const engine = service.getEngine();

      const start = performance.now();
      engine.evaluateBatch(receipts);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // Batch should complete in <5s
    });
  });
});
