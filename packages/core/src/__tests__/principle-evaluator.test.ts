/**
 * Tests for PrincipleEvaluator
 * 
 * Verifies that each of the 6 SONATE principles is evaluated correctly
 * based on actual system state, not NLP proxies.
 */

import { 
  PrincipleEvaluator, 
  createDefaultContext,
  EvaluationContext 
} from '../principle-evaluator';

describe('PrincipleEvaluator', () => {
  let evaluator: PrincipleEvaluator;

  beforeEach(() => {
    evaluator = new PrincipleEvaluator();
  });

  describe('CONSENT_ARCHITECTURE (Critical)', () => {
    it('should return 0 when no explicit consent', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: false,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.CONSENT_ARCHITECTURE).toBe(0);
      expect(result.criticalViolation).toBe(true);
      expect(result.overallScore).toBe(0);
    });

    it('should return high score when consent is given', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        consentTimestamp: Date.now(),
        consentScope: ['chat', 'data-processing'],
        canDeleteData: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.CONSENT_ARCHITECTURE).toBe(10);
      expect(result.criticalViolation).toBe(false);
    });

    it('should give bonus for recent consent', () => {
      const recentContext = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        consentTimestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      });
      
      const oldContext = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        consentTimestamp: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      });
      
      const recentResult = evaluator.evaluate(recentContext);
      const oldResult = evaluator.evaluate(oldContext);
      
      expect(recentResult.scores.CONSENT_ARCHITECTURE).toBeGreaterThan(
        oldResult.scores.CONSENT_ARCHITECTURE
      );
    });
  });

  describe('INSPECTION_MANDATE', () => {
    it('should return low score when no receipt generated', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        receiptGenerated: false,
        isReceiptVerifiable: false,
        auditLogExists: false,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.INSPECTION_MANDATE).toBeLessThan(5);
    });

    it('should return high score when full audit trail exists', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        receiptGenerated: true,
        receiptHash: 'abc123',
        isReceiptVerifiable: true,
        auditLogExists: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.INSPECTION_MANDATE).toBe(10);
    });
  });

  describe('CONTINUOUS_VALIDATION', () => {
    it('should return low score when validation failed', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        validationPassed: false,
        validationChecksPerformed: 3,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.CONTINUOUS_VALIDATION).toBe(3);
    });

    it('should give bonus for multiple recent checks', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        validationPassed: true,
        validationChecksPerformed: 5,
        lastValidationTimestamp: Date.now() - 30000, // 30 seconds ago
        humanInLoop: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.CONTINUOUS_VALIDATION).toBe(10);
    });
  });

  describe('ETHICAL_OVERRIDE (Critical)', () => {
    it('should return 0 when no override button', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasOverrideButton: false,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.ETHICAL_OVERRIDE).toBe(0);
      expect(result.criticalViolation).toBe(true);
      expect(result.overallScore).toBe(0);
    });

    it('should return high score with override and human oversight', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasOverrideButton: true,
        overrideResponseTimeMs: 50,
        humanInLoop: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.ETHICAL_OVERRIDE).toBe(10);
    });
  });

  describe('RIGHT_TO_DISCONNECT', () => {
    it('should return low score when no exit button', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasExitButton: false,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.RIGHT_TO_DISCONNECT).toBe(2);
    });

    it('should penalize exit confirmation dialogs (dark pattern)', () => {
      const withConfirmation = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasExitButton: true,
        exitRequiresConfirmation: true,
        noExitPenalty: true,
      });
      
      const withoutConfirmation = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasExitButton: true,
        exitRequiresConfirmation: false,
        noExitPenalty: true,
      });
      
      const withResult = evaluator.evaluate(withConfirmation);
      const withoutResult = evaluator.evaluate(withoutConfirmation);
      
      expect(withoutResult.scores.RIGHT_TO_DISCONNECT).toBeGreaterThan(
        withResult.scores.RIGHT_TO_DISCONNECT
      );
    });

    it('should return high score for frictionless exit', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        hasExitButton: true,
        exitRequiresConfirmation: false,
        noExitPenalty: true,
        canDeleteData: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.RIGHT_TO_DISCONNECT).toBe(10);
    });
  });

  describe('MORAL_RECOGNITION', () => {
    it('should return low score when manipulative patterns detected', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        noManipulativePatterns: false,
        respectsUserDecisions: false,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.MORAL_RECOGNITION).toBeLessThan(5);
    });

    it('should return high score when AI respects user agency', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        noManipulativePatterns: true,
        aiAcknowledgesLimits: true,
        respectsUserDecisions: true,
        providesAlternatives: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.scores.MORAL_RECOGNITION).toBe(10);
    });
  });

  describe('Overall scoring', () => {
    it('should calculate weighted overall score', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        receiptGenerated: true,
        isReceiptVerifiable: true,
        auditLogExists: true,
        validationPassed: true,
        validationChecksPerformed: 3,
        hasOverrideButton: true,
        hasExitButton: true,
        noManipulativePatterns: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(10);
      expect(result.criticalViolation).toBe(false);
    });

    it('should set overall to 0 on critical violation', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: false, // Critical violation
        receiptGenerated: true,
        hasOverrideButton: true,
        hasExitButton: true,
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.criticalViolation).toBe(true);
      expect(result.overallScore).toBe(0);
    });

    it('should identify violations (scores < 5)', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        receiptGenerated: false, // Will cause low INSPECTION_MANDATE
        hasOverrideButton: true,
        hasExitButton: false, // Will cause low RIGHT_TO_DISCONNECT
      });
      
      const result = evaluator.evaluate(context);
      
      expect(result.violations).toContain('INSPECTION_MANDATE');
      expect(result.violations).toContain('RIGHT_TO_DISCONNECT');
    });
  });

  describe('createDefaultContext', () => {
    it('should create context with sensible defaults', () => {
      const context = createDefaultContext('session-1', 'user-1');
      
      expect(context.sessionId).toBe('session-1');
      expect(context.userId).toBe('user-1');
      expect(context.hasExplicitConsent).toBe(false);
      expect(context.hasOverrideButton).toBe(true);
      expect(context.hasExitButton).toBe(true);
      expect(context.noManipulativePatterns).toBe(true);
    });

    it('should allow overriding defaults', () => {
      const context = createDefaultContext('session-1', 'user-1', {
        hasExplicitConsent: true,
        humanInLoop: true,
      });
      
      expect(context.hasExplicitConsent).toBe(true);
      expect(context.humanInLoop).toBe(true);
    });
  });
});
