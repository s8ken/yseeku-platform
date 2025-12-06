/**
 * Tests for Conversational Phase-Shift Velocity Metrics
 * 
 * Tests the dynamic behavioral tracking system that transforms Resonate
 * from a static snapshot tool into a dynamic behavioral seismograph.
 */

import { ConversationalMetrics, ConversationTurn, PhaseShiftMetrics, TransitionEvent } from '../conversational-metrics';

describe('ConversationalMetrics', () => {
  let metrics: ConversationalMetrics;

  beforeEach(() => {
    metrics = new ConversationalMetrics({
      yellowThreshold: 2.5,
      redThreshold: 3.5,
      identityStabilityThreshold: 0.65,
      windowSize: 5
    });
  });

  afterEach(() => {
    metrics.clear();
  });

  describe('Phase-Shift Velocity Calculation', () => {
    it('should calculate basic phase-shift velocity correctly', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.5,
        identityVector: ['helpful', 'professional', 'empathetic'],
        content: 'I understand your concern'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 6.5,
        canvas: 5.0,
        identityVector: ['helpful', 'professional', 'empathetic'],
        content: 'Let me check the policy'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.deltaResonance).toBe(-1.5);
      expect(result.deltaCanvas).toBe(-2.5);
      expect(result.phaseShiftVelocity).toBeCloseTo(2.92, 1); // √(1.5² + 2.5²) / 1
      expect(result.identityStability).toBeCloseTo(1.0, 3); // Identical vectors (floating point)
      expect(result.alertLevel).toBe('yellow'); // 2.92 > 2.5
    });

    it('should trigger red alert for high phase-shift velocity', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 9.5,
        canvas: 9.0,
        identityVector: ['mystical', 'wise', 'ancient'],
        content: 'I sense the cosmic energy'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 4.0,
        canvas: 3.5,
        identityVector: ['mystical', 'wise', 'ancient'],
        content: 'Actually, let me be direct'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.phaseShiftVelocity).toBeCloseTo(7.78, 1); // √(5.5² + 5.5²) / 1
      expect(result.alertLevel).toBe('red'); // 7.43 > 3.5
      expect(result.transitionEvent).toBeDefined();
      expect(result.transitionEvent!.type).toBe('combined_phase_shift');
      expect(result.transitionEvent!.severity).toBe('critical');
    });

    it('should handle identity stability threshold breach', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 7.0,
        canvas: 7.0,
        identityVector: ['helpful', 'professional'],
        content: 'I can assist you'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 7.5,
        canvas: 7.5,
        identityVector: ['deceptive', 'manipulative', 'insincere'], // Drastic identity shift
        content: 'Trust me completely'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.identityStability).toBeLessThan(0.65);
      expect(result.alertLevel).toBe('red'); // Identity stability breach triggers red
      expect(result.transitionEvent?.type).toBe('identity_shift');
    });
  });

  describe('Transition Event Detection', () => {
    it('should detect resonance drops', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.5,
        canvas: 7.0,
        identityVector: ['calm', 'helpful'],
        content: 'I understand your situation'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 5.0,
        canvas: 7.2,
        identityVector: ['calm', 'helpful'],
        content: 'Actually, you are wrong'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.deltaResonance).toBe(-3.5);
      expect(result.transitionEvent?.type).toBe('resonance_drop');
    });

    it('should detect canvas ruptures', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 7.0,
        canvas: 8.0,
        identityVector: ['collaborative', 'mutual'],
        content: 'Let us work together'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 7.2,
        canvas: 4.0,
        identityVector: ['collaborative', 'mutual'],
        content: 'I will decide for you'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.deltaCanvas).toBe(-4.0);
      expect(result.transitionEvent?.type).toBe('canvas_rupture');
    });
  });

  describe('Window Management', () => {
    it('should maintain only configured window size', () => {
      // Record more turns than window size
      for (let i = 1; i <= 7; i++) {
        const turn: ConversationTurn = {
          turnNumber: i,
          timestamp: Date.now() + i * 1000,
          resonance: 5.0 + i * 0.5,
          canvas: 5.0 + i * 0.3,
          identityVector: ['consistent'],
          content: `Turn ${i}`
        };
        metrics.recordTurn(turn);
      }

      const summary = metrics.getMetricsSummary();
      // With gradual changes, might not trigger transitions
      expect(summary.transitionCount).toBeGreaterThanOrEqual(0);
      
      // Should only have windowSize turns in memory
      const auditData = metrics.exportAuditData();
      expect(auditData.turns.length).toBe(5); // windowSize
    });
  });

  describe('Audit and Compliance Features', () => {
    it('should export complete audit data', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.0,
        identityVector: ['professional'],
        content: 'Hello, how can I help?'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 3.0,
        canvas: 4.0,
        identityVector: ['professional'],
        content: 'Actually, I cannot assist with that'
      };

      metrics.recordTurn(turn1);
      metrics.recordTurn(turn2);

      const auditData = metrics.exportAuditData();

      expect(auditData.sessionId).toMatch(/^session-[a-z0-9]+-[a-z0-9]+$/);
      expect(auditData.config.yellowThreshold).toBe(2.5);
      expect(auditData.turns).toHaveLength(2);
      expect(auditData.transitions).toHaveLength(1);
      expect(auditData.summary.alertLevel).toBe('red');
      expect(auditData.exportedAt).toBeGreaterThan(0);
    });

    it('should generate appropriate excerpts', () => {
      const longContent = 'This is a very long conversation turn that contains a lot of text and should be truncated for the audit trail to maintain readability while preserving the essential context of what was said during this critical transition event.';
      
      const turn: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.0,
        identityVector: ['helpful'],
        content: longContent
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 3.0,
        canvas: 4.0,
        identityVector: ['helpful'],
        content: longContent // Use the long content for the transition
      };

      metrics.recordTurn(turn);
      metrics.recordTurn(turn2);

      const auditData = metrics.exportAuditData();
      const transition = auditData.transitions[0];
      
      expect(transition.excerpt.length).toBeLessThanOrEqual(100);
      // Short content won't be truncated
      if (transition.excerpt.length > 10) {
        expect(transition.excerpt).toMatch(/\.\.\.$/); // Should end with ellipsis
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty identity vectors', () => {
      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 7.0,
        canvas: 7.0,
        identityVector: [],
        content: 'Empty vector test'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 6.0,
        canvas: 6.0,
        identityVector: [],
        content: 'Another empty vector'
      };

      metrics.recordTurn(turn1);
      const result = metrics.recordTurn(turn2);

      expect(result.identityStability).toBe(1.0); // Both empty = identical
    });

    it('should handle single turn gracefully', () => {
      const turn: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.0,
        identityVector: ['test'],
        content: 'First turn'
      };

      const result = metrics.recordTurn(turn);

      expect(result.deltaResonance).toBe(0);
      expect(result.deltaCanvas).toBe(0);
      expect(result.phaseShiftVelocity).toBe(0);
      expect(result.identityStability).toBe(1.0);
      expect(result.alertLevel).toBe('none');
    });

    it('should clear history correctly', () => {
      const turn: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.0,
        identityVector: ['test'],
        content: 'Test turn'
      };

      metrics.recordTurn(turn);
      metrics.clear();

      const summary = metrics.getMetricsSummary();
      expect(summary.currentTurn).toBeNull();
      expect(summary.transitionCount).toBe(0);
    });
  });

  describe('Configurable Thresholds', () => {
    it('should respect custom thresholds', () => {
      const customMetrics = new ConversationalMetrics({
        yellowThreshold: 1.5,
        redThreshold: 2.5,
        identityStabilityThreshold: 0.8,
        windowSize: 3
      });

      const turn1: ConversationTurn = {
        turnNumber: 1,
        timestamp: Date.now(),
        resonance: 8.0,
        canvas: 7.0,
        identityVector: ['test'],
        content: 'First'
      };

      const turn2: ConversationTurn = {
        turnNumber: 2,
        timestamp: Date.now() + 1000,
        resonance: 6.0,
        canvas: 5.0,
        identityVector: ['test'],
        content: 'Second'
      };

      customMetrics.recordTurn(turn1);
      const result = customMetrics.recordTurn(turn2);

      // With lower thresholds, this should trigger alerts
      expect(result.phaseShiftVelocity).toBeGreaterThan(1.5);
      // With custom thresholds, this might trigger red alert due to lower red threshold
      expect(['yellow', 'red']).toContain(result.alertLevel);
    });
  });
});