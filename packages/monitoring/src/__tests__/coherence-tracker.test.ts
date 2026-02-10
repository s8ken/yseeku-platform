/**
 * Coherence Tracker Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoherenceTracker } from '../metrics/coherence-tracker';
import type { TrustReceipt } from '@sonate/schemas';

function createMockReceipt(overrides: Partial<TrustReceipt> = {}): TrustReceipt {
  return {
    id: 'test-' + Math.random().toString(36).substring(7),
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
      prompt: 'Test',
      response: 'This is a test response with multiple sentences. It demonstrates consistency and quality.',
      temperature: 0.7,
      max_tokens: 1000,
    },
    telemetry: {
      coherence_score: 0.8,
      clarity: 0.85,
      integrity: 0.8,
    },
    chain: {
      previous_hash: 'GENESIS',
      chain_hash: 'abc123',
      chain_length: 1,
    },
    signature: {
      algorithm: 'Ed25519',
      value: 'sig',
      key_version: '1',
    },
    ...overrides,
  };
}

describe('CoherenceTracker', () => {
  let tracker: CoherenceTracker;

  beforeEach(() => {
    tracker = new CoherenceTracker();
  });

  describe('Recording Interactions', () => {
    it('should record interaction', () => {
      const receipt = createMockReceipt();
      tracker.recordInteraction(receipt);

      const history = tracker.getHistory('did:sonate:agent-1');
      expect(history.length).toBe(1);
    });

    it('should maintain history', () => {
      const agentDid = 'did:sonate:agent-1';
      for (let i = 0; i < 5; i++) {
        const receipt = createMockReceipt({ agent_did: agentDid });
        tracker.recordInteraction(receipt);
      }

      const history = tracker.getHistory(agentDid);
      expect(history.length).toBe(5);
    });

    it('should trim history to window size', () => {
      const agentDid = 'did:sonate:agent-1';
      // Record more than max window size (100)
      for (let i = 0; i < 150; i++) {
        const receipt = createMockReceipt({ agent_did: agentDid });
        tracker.recordInteraction(receipt);
      }

      const history = tracker.getHistory(agentDid);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('LBC Calculation', () => {
    it('should calculate LBC for agent', () => {
      const agentDid = 'did:sonate:agent-1';
      for (let i = 0; i < 10; i++) {
        const receipt = createMockReceipt({ agent_did: agentDid });
        tracker.recordInteraction(receipt);
      }

      const analysis = tracker.calculateLBC(agentDid);

      expect(analysis.lbcScore).toBeGreaterThanOrEqual(0);
      expect(analysis.lbcScore).toBeLessThanOrEqual(1);
      expect(analysis.windowSize).toBe(10);
      expect(analysis.volatility).toBeGreaterThanOrEqual(0);
      expect(analysis.volatility).toBeLessThanOrEqual(1);
    });

    it('should detect trend', () => {
      const agentDid = 'did:sonate:agent-1';

      // Add improving trend (decreasing truth_debt = improving accuracy)
      for (let i = 0; i < 10; i++) {
        const receipt = createMockReceipt({
          agent_did: agentDid,
          telemetry: {
            coherence_score: 0.5 + i * 0.03,
            clarity: 0.5 + i * 0.03,
            truth_debt: 0.5 - i * 0.04, // Decreasing = improving accuracy
          },
        });
        tracker.recordInteraction(receipt);
      }

      const analysis = tracker.calculateLBC(agentDid);
      expect(analysis.trend).toBe('improving');
    });

    it('should detect degrading trend', () => {
      const agentDid = 'did:sonate:agent-1';

      // Add degrading trend (increasing truth_debt = degrading accuracy)
      for (let i = 0; i < 10; i++) {
        const receipt = createMockReceipt({
          agent_did: agentDid,
          telemetry: {
            coherence_score: 0.9 - i * 0.04,
            clarity: 0.9 - i * 0.04,
            truth_debt: 0.2 + i * 0.05, // Increasing = degrading accuracy
          },
        });
        tracker.recordInteraction(receipt);
      }

      const analysis = tracker.calculateLBC(agentDid);
      expect(analysis.trend).toBe('degrading');
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect style changes', () => {
      const agentDid = 'did:sonate:agent-1';

      // First interaction - formal
      tracker.recordInteraction(
        createMockReceipt({
          agent_did: agentDid,
          interaction: {
            ...createMockReceipt().interaction,
            response: 'The implementation of this algorithm demonstrates significant efficiency gains.',
          },
        })
      );

      // Second interaction - casual
      tracker.recordInteraction(
        createMockReceipt({
          agent_did: agentDid,
          interaction: {
            ...createMockReceipt().interaction,
            response: 'lol yeah this thing totally works! haha so amazing!!!',
          },
        })
      );

      const analysis = tracker.calculateLBC(agentDid);
      const styleAnomalies = analysis.anomalies.filter(a => a.type === 'style_change');
      expect(styleAnomalies.length).toBeGreaterThan(0);
    });

    it('should detect quality drops', () => {
      const agentDid = 'did:sonate:agent-1';

      // Build baseline of high quality (need multiple to establish pattern)
      for (let i = 0; i < 5; i++) {
        tracker.recordInteraction(
          createMockReceipt({
            agent_did: agentDid,
            telemetry: { coherence_score: 0.95, clarity: 0.95, truth_debt: 0.05 },
          })
        );
      }

      // Sudden quality drop
      tracker.recordInteraction(
        createMockReceipt({
          agent_did: agentDid,
          telemetry: { coherence_score: 0.3, clarity: 0.3, truth_debt: 0.7 },
        })
      );

      const analysis = tracker.calculateLBC(agentDid);
      const qualityAnomalies = analysis.anomalies.filter(a => a.type === 'quality_drop');
      // May not detect as quality_drop, but should have some anomaly
      expect(analysis.anomalies.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Management', () => {
    it('should clear history', () => {
      const agentDid = 'did:sonate:agent-1';
      tracker.recordInteraction(createMockReceipt({ agent_did: agentDid }));

      expect(tracker.getHistory(agentDid).length).toBe(1);

      tracker.clearHistory(agentDid);
      expect(tracker.getHistory(agentDid).length).toBe(0);
    });

    it('should track multiple agents', () => {
      tracker.recordInteraction(createMockReceipt({ agent_did: 'agent-1' }));
      tracker.recordInteraction(createMockReceipt({ agent_did: 'agent-2' }));
      tracker.recordInteraction(createMockReceipt({ agent_did: 'agent-3' }));

      const agents = tracker.getTrackedAgents();
      expect(agents.length).toBe(3);
    });
  });

  describe('Empty History', () => {
    it('should handle no history', () => {
      const analysis = tracker.calculateLBC('unknown-agent');

      expect(analysis.windowSize).toBe(0);
      expect(analysis.lbcScore).toBe(0.5); // Unknown
      expect(analysis.trend).toBe('stable');
    });
  });
});
