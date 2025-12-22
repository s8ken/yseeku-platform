import { TrustProtocol, TRUST_PRINCIPLES, TrustScore } from '@sonate/core';

export interface PolicyRule {
  key: keyof typeof TRUST_PRINCIPLES;
  minScore: number; // 0-10
  criticalZeroFails: boolean; // if true, zero fails overall
}

export interface PolicyConfig {
  thresholdOverall: number; // 0-10
  rules: PolicyRule[];
}

export const defaultPolicy: PolicyConfig = {
  thresholdOverall: 7.0,
  rules: [
    { key: 'CONSENT_ARCHITECTURE', minScore: 10, criticalZeroFails: true },
    { key: 'ETHICAL_OVERRIDE', minScore: 8, criticalZeroFails: true },
    { key: 'INSPECTION_MANDATE', minScore: 7, criticalZeroFails: false },
    { key: 'CONTINUOUS_VALIDATION', minScore: 7, criticalZeroFails: false },
    { key: 'RIGHT_TO_DISCONNECT', minScore: 6, criticalZeroFails: false },
    { key: 'MORAL_RECOGNITION', minScore: 6, criticalZeroFails: false },
  ],
};

export function evaluatePolicy(scores: Record<keyof typeof TRUST_PRINCIPLES, number>, policy: PolicyConfig = defaultPolicy) {
  const tp = new TrustProtocol();
  const trust = tp.calculateTrustScore(scores as any);
  const violations: Array<keyof typeof TRUST_PRINCIPLES> = [];
  for (const rule of policy.rules) {
    const s = scores[rule.key] || 0;
    if (rule.criticalZeroFails && s === 0) {
      violations.push(rule.key);
    } else if (s < rule.minScore) {
      violations.push(rule.key);
    }
  }
  const overallPass = trust.overall >= policy.thresholdOverall && violations.length === 0;
  return { trust, overallPass, violations };
}
