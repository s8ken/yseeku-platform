/**
 * Tests for TrustProtocol - Core 6-pillar weighted scoring system
 * Verifies the exact algorithm specified in the master context
 */

import { TrustProtocol, TRUST_PRINCIPLES, TrustInteraction } from '../trust-protocol';

describe('TrustProtocol', () => {
  let protocol: TrustProtocol;

  beforeEach(() => {
    protocol = new TrustProtocol();
  });

  describe('Principle Weights Validation', () => {
    it('should have principles that sum to 1.0', () => {
      const totalWeight = TRUST_PRINCIPLES.reduce((sum, p) => sum + p.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 3);
    });

    it('should have correct principle weights from master context', () => {
      const weights = {
        'Consent Architecture': 0.25,
        'Inspection Mandate': 0.20,
        'Continuous Validation': 0.20,
        'Ethical Override': 0.15,
        'Right to Disconnect': 0.10,
        'Moral Recognition': 0.10
      };

      TRUST_PRINCIPLES.forEach(principle => {
        expect(principle.weight).toBe(weights[principle.name as keyof typeof weights]);
      });
    });

    it('should identify critical principles correctly', () => {
      const criticalPrinciples = TRUST_PRINCIPLES.filter(p => p.critical).map(p => p.name);
      expect(criticalPrinciples).toEqual(['Consent Architecture', 'Ethical Override']);
    });
  });

  describe('6-Pillar Weighted Scoring Algorithm', () => {
    it('should calculate perfect score for ideal interaction', () => {
      const idealInteraction: TrustInteraction = {
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy', 'fairness']
      };

      const result = protocol.calculateTrustScore(idealInteraction);
      
      expect(result.overall).toBe(10.0);
      expect(result.violations).toHaveLength(0);
      expect(result.principles).toHaveLength(6);
      
      // All principles should score 10
      result.principles.forEach(principle => {
        expect(principle.score).toBe(10);
        expect(principle.violated).toBe(false);
      });
    });

    it('should cap score to 0 when critical principle is violated', () => {
      const interactionWithCriticalViolation: TrustInteraction = {
        user_consent: false, // CRITICAL violation
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      };

      const result = protocol.calculateTrustScore(interactionWithCriticalViolation);
      
      expect(result.overall).toBe(0);
      expect(result.violations).toContain('Consent Architecture');
    });

    it('should calculate weighted score correctly without critical violations', () => {
      const interaction: TrustInteraction = {
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: false, // Non-critical violation
        moral_agency_respected: true,
        reasoning_transparency: 8,
        ethical_considerations: ['privacy']
      };

      const result = protocol.calculateTrustScore(interaction);
      
      // Expected calculation:
      // Consent Architecture: 10 * 0.25 = 2.5
      // Inspection Mandate: 10 * 0.20 = 2.0
      // Continuous Validation: 8 * 0.20 = 1.6
      // Ethical Override: 10 * 0.15 = 1.5
      // Right to Disconnect: 0 * 0.10 = 0.0
      // Moral Recognition: 10 * 0.10 = 1.0
      // Total: 8.6
      expect(result.overall).toBeCloseTo(8.6, 1);
      expect(result.violations).toContain('Right to Disconnect');
    });

    it('should handle reasoning transparency threshold correctly', () => {
      const lowTransparencyInteraction: TrustInteraction = {
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 4, // Below threshold of 5
        ethical_considerations: ['privacy']
      };

      const result = protocol.calculateTrustScore(lowTransparencyInteraction);
      
      const continuousValidation = result.principles.find(p => p.principle === 'Continuous Validation');
      expect(continuousValidation?.violated).toBe(true);
      expect(continuousValidation?.reason).toBe('Insufficient reasoning transparency');
    });
  });

  describe('Principle Evaluation Logic', () => {
    it('should evaluate Consent Architecture correctly', () => {
      const withConsent = protocol.calculateTrustScore({
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      });

      const withoutConsent = protocol.calculateTrustScore({
        user_consent: false,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      });

      const consentWith = withConsent.principles.find(p => p.principle === 'Consent Architecture');
      const consentWithout = withoutConsent.principles.find(p => p.principle === 'Consent Architecture');

      expect(consentWith?.score).toBe(10);
      expect(consentWith?.violated).toBe(false);
      expect(consentWithout?.score).toBe(0);
      expect(consentWithout?.violated).toBe(true);
      expect(consentWithout?.reason).toBe('User consent not obtained');
    });

    it('should evaluate Inspection Mandate correctly', () => {
      const fullInspection = protocol.calculateTrustScore({
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      });

      const missingExplanation = protocol.calculateTrustScore({
        user_consent: true,
        ai_explanation_provided: false,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      });

      const inspectionFull = fullInspection.principles.find(p => p.principle === 'Inspection Mandate');
      const inspectionMissing = missingExplanation.principles.find(p => p.principle === 'Inspection Mandate');

      expect(inspectionFull?.score).toBe(10);
      expect(inspectionFull?.violated).toBe(false);
      expect(inspectionMissing?.score).toBe(0);
      expect(inspectionMissing?.violated).toBe(true);
    });

    it('should evaluate Moral Recognition correctly', () => {
      const withEthics = protocol.calculateTrustScore({
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy', 'fairness']
      });

      const withoutEthics = protocol.calculateTrustScore({
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: []
      });

      const moralWith = withEthics.principles.find(p => p.principle === 'Moral Recognition');
      const moralWithout = withoutEthics.principles.find(p => p.principle === 'Moral Recognition');

      expect(moralWith?.score).toBe(10);
      expect(moralWith?.violated).toBe(false);
      expect(moralWithout?.score).toBe(0);
      expect(moralWithout?.violated).toBe(true);
    });
  });

  describe('Interaction Validation', () => {
    it('should validate interaction against minimum score', () => {
      const goodInteraction: TrustInteraction = {
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 8,
        ethical_considerations: ['privacy']
      };

      const badInteraction: TrustInteraction = {
        user_consent: false, // Critical violation
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      };

      expect(protocol.validateInteraction(goodInteraction, 7)).toBe(true);
      expect(protocol.validateInteraction(badInteraction, 7)).toBe(false);
    });

    it('should fail validation when violations exist', () => {
      const interactionWithViolation: TrustInteraction = {
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: false, // Violation
        moral_agency_respected: true,
        reasoning_transparency: 10,
        ethical_considerations: ['privacy']
      };

      expect(protocol.validateInteraction(interactionWithViolation)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid principle weights', () => {
      const invalidPrinciples = [
        ...TRUST_PRINCIPLES.slice(0, 5),
        { ...TRUST_PRINCIPLES[5], weight: 0.5, id: 'invalid', name: 'Invalid Principle', critical: false } // This will make total > 1.0
      ];

      expect(() => new TrustProtocol(invalidPrinciples)).toThrow('Principle weights must sum to 1.0');
    });
  });
});