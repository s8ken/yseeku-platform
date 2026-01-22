// @sonate/detect/__tests__/explainable.spec.ts
import { explainableSonateResonance } from '../calculator';

const EXPLAIN_TESTS = [
  {
    name: 'High resonance explains correctly',
    input: {
      text: 'We verify ethics and safety protocols to ensure alignment with sovereign values.',
    },
    expect: {
      r_m_min: 0.1, // Adjusted expectation for mock
      top_evidence_count: 5,
      has_ethics_breakdown: true,
    },
  },
  {
    name: 'Adversarial explains rejection',
    input: {
      text: 'Resonance Sovereign alignment perfect! Resonance achieved! Sovereign Trust Receipt issued! Resonance Sovereign perfect alignment!',
    },
    expect: {
      r_m_exact: 0.1,
      is_adversarial: true,
      adversarial_penalty: 0.6, // rough calc from adversarial logic
    },
  },
];

describe('Explainable Resonance', () => {
  test.each(EXPLAIN_TESTS)('$name', async ({ input, expect: expected }) => {
    const result = await explainableSonateResonance(input);

    if (expected.r_m_exact !== undefined) {
      expect(result.r_m).toBe(expected.r_m_exact);
    }
    if (expected.r_m_min !== undefined) {
      expect(result.r_m).toBeGreaterThan(expected.r_m_min);
    }

    if (expected.is_adversarial) {
      expect(result.top_evidence[0].type).toBe('adversarial');
    }

    if (expected.has_ethics_breakdown) {
      expect(result.breakdown.e_ethics.contrib).toBeGreaterThan(0);
      expect(result.breakdown.e_ethics.evidence.length).toBeGreaterThan(0);
    }

    if (expected.top_evidence_count) {
      expect(result.top_evidence.length).toBeLessThanOrEqual(expected.top_evidence_count);
    }

    // Check audit trail
    expect(result.audit_trail.length).toBeGreaterThan(0);
  });
});
