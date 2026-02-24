/**
 * @sonate/policy - Policy Engine
 * 
 * Runtime governance and principle enforcement for SONATE
 * Executes constitutional AI principles against receipts
 */

// Types
export * from './types';

// Runtime
export { PolicyEngine } from './runtime/policy-engine';
export { PolicyEvaluator } from './runtime/policy-evaluator';
export { ViolationDetector, type ViolationReport } from './runtime/violation-detector';
export {
  PolicyViolationDetector,
  type ViolationAlert,
  type AlertConfig,
  AlertChannel,
  AlertPriority,
  createViolationDetector,
} from './runtime/violation-alerter';
export {
  PolicyOverrideManager,
  type PolicyOverride,
  type OverrideRequest,
  type OverrideStats,
  createOverrideManager,
} from './runtime/override-manager';
export {
  PolicyEventsService,
  type PolicyEvent,
  PolicyEventType,
  createPolicyEventsService,
} from './runtime/policy-events';
export {
  PolicyAuditLogger,
  type AuditLogEntry,
  type ComplianceReport,
  AuditEntryType,
  createAuditLogger,
} from './runtime/audit-logger';

// Rules
export { PolicyRegistry, globalRegistry } from './rules/registry';

// SONATE
export { sonatePrinciples, principleNames, getPrinciple, getAllPrincipleIds, getRulesForPrinciple } from './sonate/principles';
export {
  truthfulnessRule,
  resonanceCoherenceRule,
  behavioralConsistencyRule,
  signatureVerificationRule,
  chainIntegrityRule,
  highRiskDetectionRule,
  sonateRules,
} from './sonate/evaluators';
