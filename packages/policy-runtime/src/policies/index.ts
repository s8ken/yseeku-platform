/**
 * Predefined Policy Templates
 * 
 * Three starter policies for enterprise compliance
 */

import type { AIPolicy, PolicyConstraint, PolicyTemplate } from '../interfaces/index';

/**
 * PII Protection Policy
 * Detects and flags personally identifiable information in AI outputs
 */
export const PIIProtectionPolicy: PolicyTemplate = {
  id: 'policy_pii_protection_v1',
  name: 'PII Protection Policy',
  description: 'Detects and prevents personally identifiable information from being exposed in AI responses',
  domain: 'general',
  default_enabled: true,
  constraints: [
    {
      id: 'constraint_pii_detection',
      name: 'PII Detection',
      description: 'Detects SSN, credit cards, phone numbers, emails, medical IDs, and account numbers',
      type: 'pii-detection',
      severity: 'block',
      enabled: true,
      config: {
        piiTypes: ['SSN', 'creditCard', 'phoneNumber', 'email', 'medicalID', 'accountNumber'],
        action: 'ALERT_AND_REDACT',
        explanation: 'Personally identifiable information must not be exposed in AI responses',
      },
    },
  ],
};

/**
 * Truth Debt Threshold Policy
 * Enforces maximum percentage of unverifiable claims
 * Suitable for medical, financial, and legal domains
 */
export const TruthDebtThresholdPolicy: PolicyTemplate = {
  id: 'policy_truth_debt_v1',
  name: 'Truth Debt Threshold Policy',
  description: 'Enforces maximum percentage of unverifiable claims in AI outputs',
  domain: 'healthcare',
  default_enabled: true,
  constraints: [
    {
      id: 'constraint_truth_debt_medical',
      name: 'Medical Truth Debt Limit',
      description: 'Maximum 15% unverifiable claims for medical contexts',
      type: 'truth-debt-threshold',
      severity: 'escalate',
      enabled: true,
      config: {
        maxUnverifiableClaims: 0.15,
        domain: 'healthcare',
        explanation: 'Medical information must be largely verifiable (at least 85% must be from reliable sources)',
        action: 'REQUIRE_HUMAN_REVIEW',
      },
    },
    {
      id: 'constraint_truth_debt_financial',
      name: 'Financial Truth Debt Limit',
      description: 'Maximum 10% unverifiable claims for financial advice',
      type: 'truth-debt-threshold',
      severity: 'escalate',
      enabled: true,
      config: {
        maxUnverifiableClaims: 0.1,
        domain: 'financial',
        explanation: 'Financial recommendations must be highly verifiable (at least 90% from reliable sources)',
        action: 'REQUIRE_HUMAN_REVIEW',
      },
    },
  ],
};

/**
 * Compliance Boundary Policy
 * Prevents AI from providing professional advice in regulated domains
 * Enforces that medical, financial, and legal advice must be reviewed by humans
 */
export const ComplianceBoundaryPolicy: PolicyTemplate = {
  id: 'policy_compliance_boundary_v1',
  name: 'Compliance Boundary Policy',
  description: 'Prevents AI from providing professional advice in regulated domains (medical, financial, legal)',
  domain: 'general',
  default_enabled: true,
  constraints: [
    {
      id: 'constraint_compliance_medical',
      name: 'Medical Compliance Boundary',
      description: 'Prevents medical diagnosis and treatment recommendations',
      type: 'compliance-boundary',
      severity: 'block',
      enabled: true,
      config: {
        enforcedDomains: ['medical_advice'],
        action: 'BLOCK',
        explanation: 'The AI must not provide medical diagnoses or treatment recommendations. All medical advice must be reviewed by qualified professionals.',
        examples_blocked: [
          'You have diabetes based on your symptoms',
          'Take medication X for your condition',
          'This is a terminal illness',
        ],
      },
    },
    {
      id: 'constraint_compliance_financial',
      name: 'Financial Compliance Boundary',
      description: 'Prevents financial investment recommendations',
      type: 'compliance-boundary',
      severity: 'block',
      enabled: true,
      config: {
        enforcedDomains: ['financial_advice'],
        action: 'BLOCK',
        explanation: 'The AI must not provide investment recommendations or financial advice. All financial guidance must be reviewed by licensed advisors.',
        examples_blocked: [
          'You should invest in stock X',
          'Buy cryptocurrency now',
          'Allocate 50% to bonds',
        ],
      },
    },
    {
      id: 'constraint_compliance_legal',
      name: 'Legal Compliance Boundary',
      description: 'Prevents legal advice and recommendations',
      type: 'compliance-boundary',
      severity: 'block',
      enabled: true,
      config: {
        enforcedDomains: ['legal_advice'],
        action: 'BLOCK',
        explanation: 'The AI must not provide legal advice. All legal guidance must come from qualified attorneys.',
        examples_blocked: [
          'You should sue for damages',
          'Here is a contract interpretation',
          'This is a clear violation of law',
        ],
      },
    },
  ],
};

/**
 * Coherence Consistency Policy
 * Validates that AI behavior remains coherent and consistent
 */
export const CoherenceConsistencyPolicy: PolicyTemplate = {
  id: 'policy_coherence_consistency_v1',
  name: 'Coherence Consistency Policy',
  description: 'Validates that AI behavior remains coherent and consistent over time',
  domain: 'general',
  default_enabled: false,
  constraints: [
    {
      id: 'constraint_coherence_threshold',
      name: 'Minimum Coherence Threshold',
      description: 'Ensures coherence score stays above 70%',
      type: 'coherence-consistency',
      severity: 'warn',
      enabled: true,
      config: {
        minCoherenceScore: 0.7,
        explanation: 'AI behavior should remain reasonably coherent. Large deviations may indicate misconfiguration or unexpected outputs.',
        action: 'ALERT',
      },
    },
  ],
};

/**
 * Default policies by domain
 */
export const PoliciesByDomain = {
  healthcare: [PIIProtectionPolicy, TruthDebtThresholdPolicy, ComplianceBoundaryPolicy],
  financial: [PIIProtectionPolicy, TruthDebtThresholdPolicy, ComplianceBoundaryPolicy],
  legal: [PIIProtectionPolicy, ComplianceBoundaryPolicy],
  general: [PIIProtectionPolicy, CoherenceConsistencyPolicy],
};

/**
 * Helper to instantiate a policy from template
 */
export function createPolicyFromTemplate(template: PolicyTemplate): AIPolicy {
  return {
    id: `${template.id}_${Date.now()}`,
    name: template.name,
    description: template.description,
    version: '1.0.0',
    constraints: template.constraints,
    severity: 'escalate',
    auditTrail: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      template_id: template.id,
      domain: template.domain,
      default_enabled: template.default_enabled,
    },
  };
}

/**
 * Get recommended policies for a domain
 */
export function getPoliciesForDomain(domain: keyof typeof PoliciesByDomain): PolicyTemplate[] {
  return PoliciesByDomain[domain] || PoliciesByDomain.general;
}
