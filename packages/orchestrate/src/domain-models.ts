/**
 * Unified Domain Models for Yseeku SONATE Platform
 * Integrated from SYMBI-Synergy (agents) and SYMBI-Symphony (orchestration)
 */

// ========================================
// POLICY DOMAIN MODEL
// ========================================

export interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'disabled';

  // Policy Definition
  type: 'constitutional' | 'operational' | 'security' | 'compliance' | 'ethical';
  category:
    | 'data_protection'
    | 'ai_governance'
    | 'agent_behavior'
    | 'human_oversight'
    | 'risk_management';

  // Rules & Constraints
  rules: PolicyRule[];
  constraints: PolicyConstraint[];
  exceptions: PolicyException[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;

  // Applicability
  scope: PolicyScope;
  agents: string[]; // Agent IDs this policy applies to
  workflows: string[]; // Workflow IDs this policy applies to

  // Enforcement
  enforcementLevel: 'advisory' | 'warning' | 'blocking' | 'critical';
  violationActions: ViolationAction[];

  // Compliance Mapping
  complianceFrameworks: ComplianceMapping[];
}

export interface PolicyRule {
  id: string;
  name: string;
  condition: string; // JSON Logic or expression
  action: string; // What to do when condition is met
  priority: number;
  enabled: boolean;
}

export interface PolicyConstraint {
  id: string;
  type: 'rate_limit' | 'data_access' | 'resource_usage' | 'time_window' | 'geographic';
  parameters: Record<string, any>;
  threshold?: number;
  unit?: string;
}

export interface PolicyException {
  id: string;
  reason: string;
  conditions: Record<string, any>;
  approvedBy: string;
  approvedAt: Date;
  expiresAt?: Date;
}

export interface PolicyScope {
  tenants?: string[];
  departments?: string[];
  roles?: string[];
  agentTypes?: string[];
  workflowTypes?: string[];
}

export interface ViolationAction {
  type: 'log' | 'alert' | 'block' | 'escalate' | 'quarantine';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface ComplianceMapping {
  framework: 'GDPR' | 'EU_AI_Act' | 'SOC2' | 'ISO27001' | 'NIST_AI_RMF' | 'CCPA';
  articles: string[]; // Framework-specific article IDs
  controls: string[]; // Control identifiers
  evidenceRequired: boolean;
}

// ========================================
// FLOW DOMAIN MODEL
// ========================================

export interface Flow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'paused' | 'disabled';

  // Flow Definition
  type: 'sequential' | 'parallel' | 'conditional' | 'event_driven' | 'adaptive';
  category: 'ai_generation' | 'data_processing' | 'validation' | 'approval' | 'monitoring';

  // Workflow Structure
  definition: WorkflowDefinition;
  tasks: FlowTask[];
  dependencies: TaskDependency[];
  triggers: FlowTrigger[];

  // Runtime Control
  executionMode: 'automatic' | 'manual_approval' | 'supervised' | 'sandbox';
  timeoutSettings: TimeoutSettings;
  retryPolicy: RetryPolicy;

  // Interventions
  interventionPoints: InterventionPoint[];
  escalationRules: EscalationRule[];
  humanInLoopConfig: HumanInLoopConfig;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Performance & Monitoring
  performanceMetrics: FlowPerformanceMetrics;
  slaRequirements: SLARequirements;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  agents: AgentRole[];
  tasks: FlowTask[];
  dependencies: TaskDependency[];
  triggers: FlowTrigger[];
  timeout?: number;
}

export interface AgentRole {
  agentId: string;
  role: 'coordinator' | 'executor' | 'validator' | 'observer' | 'monitor';
  capabilities: string[];
  priority: number;
  constraints?: Record<string, any>;
}

export interface FlowTask {
  id: string;
  name: string;
  type:
    | 'llm_generation'
    | 'data_processing'
    | 'validation'
    | 'coordination'
    | 'approval'
    | 'monitoring';
  assignedAgent?: string;
  requiredCapabilities: string[];
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting_approval';
  retryCount: number;
  maxRetries: number;
  timeout: number;

  // Control & Monitoring
  controlPoints: ControlPoint[];
  monitoringRules: MonitoringRule[];
  humanReviewRequired: boolean;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  condition?: 'all' | 'any' | 'custom';
  customCondition?: string;
}

export interface FlowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook' | 'threshold';
  config: Record<string, any>;
  enabled: boolean;
}

export interface InterventionPoint {
  taskId: string;
  type: 'pre_execution' | 'post_execution' | 'on_error' | 'on_threshold';
  condition: string;
  action: InterventionAction;
  automatic: boolean;
  requiresApproval: boolean;
}

export interface InterventionAction {
  type: 'pause' | 'redirect' | 'escalate' | 'modify_input' | 'override_result';
  parameters: Record<string, any>;
  recipients?: string[];
}

export interface EscalationRule {
  id: string;
  name: string;
  condition: string;
  level: number;
  recipients: string[];
  timeout?: number;
  actions: string[];
}

export interface HumanInLoopConfig {
  required: boolean;
  approvalThreshold: number; // Number of human approvers required
  approvers: string[];
  timeout: number;
  fallbackAction: 'approve' | 'reject' | 'escalate';
}

export interface TimeoutSettings {
  task: number;
  workflow: number;
  approval: number;
  escalation: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryConditions: string[];
}

// ========================================
// TRUST RECEIPT DOMAIN MODEL
// ========================================

export interface TrustReceipt {
  id: string;
  hash: string;
  previousHash: string;
  timestamp: number;

  // Transaction Details
  transactionId: string;
  transactionType:
    | 'agent_action'
    | 'workflow_execution'
    | 'policy_violation'
    | 'compliance_check'
    | 'human_intervention';
  agentId?: string;
  workflowId?: string;
  policyId?: string;

  // Content (immutable)
  data: TrustReceiptData;
  signature: string;
  publicKey: string;

  // Cryptographic Proofs
  merkleProof?: MerkleProof;
  zkProof?: ZKProof;
  multiSig?: MultiSignature;

  // Validation Status
  validationStatus: 'pending' | 'validated' | 'invalid' | 'tampered';
  validatedAt?: Date;
  validatedBy?: string;

  // Chain Information
  blockNumber: number;
  chainIndex: number;

  // Metadata
  version: string;
  schema: string;
}

export interface TrustReceiptData {
  action: string;
  input?: any;
  output?: any;
  context: Record<string, any>;
  metrics: Record<string, number>;
  compliance: ComplianceStatus;
  risk: RiskAssessment;
  auditTrail: AuditEntry[];
}

export interface ComplianceStatus {
  frameworks: Record<string, FrameworkCompliance>;
  overallScore: number;
  violations: ComplianceViolation[];
  gaps: ComplianceGap[];
}

export interface FrameworkCompliance {
  framework: string;
  score: number;
  controls: Record<string, ControlStatus>;
  evidence: EvidenceItem[];
}

export interface ControlStatus {
  controlId: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  evidence?: string;
  lastAssessed: Date;
}

export interface EvidenceItem {
  type: 'log' | 'metric' | 'document' | 'test_result' | 'human_attestation';
  reference: string;
  hash: string;
  timestamp: Date;
}

export interface ComplianceViolation {
  framework: string;
  article: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ComplianceGap {
  framework: string;
  control: string;
  description: string;
  impact: string;
  recommendation: string;
  priority: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  mitigation: string[];
  residualRisk: number; // 0-100
}

export interface RiskFactor {
  type: 'security' | 'privacy' | 'ethical' | 'operational' | 'reputational';
  score: number; // 0-100
  description: string;
  impact: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  actor: string;
  component: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

// ========================================
// COMPLIANCE SNAPSHOT DOMAIN MODEL
// ========================================

export interface ComplianceSnapshot {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };

  // Overall Status
  overallScore: number;
  status: 'compliant' | 'non_compliant' | 'partial_compliance' | 'not_assessed';

  // Framework Breakdown
  frameworks: Record<string, FrameworkSnapshot>;

  // Trends & Analytics
  trends: ComplianceTrend[];
  insights: ComplianceInsight[];
  recommendations: ComplianceRecommendation[];

  // Evidence & Audit
  evidencePackages: EvidencePackage[];
  auditFindings: AuditFinding[];

  // Certifications & Attestations
  certifications: Certification[];
  attestations: Attestation[];

  // Metadata
  version: string;
  generatedBy: string;
  reviewedBy?: string;
  approvedAt?: Date;
}

export interface FrameworkSnapshot {
  framework: string;
  version: string;
  score: number;
  status: 'compliant' | 'non_compliant' | 'partial_compliance' | 'not_assessed';

  controls: Record<string, ControlSnapshot>;
  articles: Record<string, ArticleSnapshot>;

  gaps: number;
  violations: number;
  remediationTasks: number;

  lastUpdated: Date;
  nextAssessment: Date;
}

export interface ControlSnapshot {
  controlId: string;
  title: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  score: number;

  implementation: ImplementationStatus;
  testing: TestingStatus;
  evidence: EvidenceStatus;

  lastAssessed: Date;
  nextReview: Date;

  issues: ComplianceIssue[];
  remediation: RemediationTask[];
}

export interface ArticleSnapshot {
  articleId: string;
  title: string;
  status: 'active' | 'pending' | 'breached' | 'waived';
  compliance: number;
  guilt: number;
  lastValidated: Date;
  evidenceCount: number;
}

export interface ImplementationStatus {
  status: 'implemented' | 'partially_implemented' | 'not_implemented';
  coverage: number; // percentage
  documentation: boolean;
  procedures: boolean;
  training: boolean;
}

export interface TestingStatus {
  status: 'tested' | 'partially_tested' | 'not_tested';
  frequency: string;
  lastTest: Date;
  nextTest: Date;
  testResults: TestResult[];
}

export interface EvidenceStatus {
  collected: number;
  required: number;
  quality: 'adequate' | 'partial' | 'inadequate';
  lastCollection: Date;
  gaps: string[];
}

export interface ComplianceTrend {
  framework: string;
  metric: string;
  period: string;
  data: TrendDataPoint[];
  direction: 'improving' | 'stable' | 'declining';
  significance: number;
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  events?: string[];
}

export interface ComplianceInsight {
  type: 'risk' | 'opportunity' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  data: Record<string, any>;
}

export interface ComplianceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'policy' | 'process' | 'technology' | 'training';
  title: string;
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
}

export interface EvidencePackage {
  id: string;
  framework: string;
  controls: string[];
  items: EvidenceItem[];
  hash: string;
  timestamp: Date;
  verified: boolean;
}

export interface AuditFinding {
  id: string;
  category: 'control_deficiency' | 'process_gap' | 'documentation' | 'technical' | 'human_factor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'closed';
  assignedTo: string;
  dueDate: Date;
}

export interface Certification {
  name: string;
  authority: string;
  scope: string;
  validFrom: Date;
  validTo: Date;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  certificateNumber: string;
  evidencePackage: string;
}

export interface Attestation {
  type: string;
  attestant: string;
  statement: string;
  date: Date;
  evidence: string[];
  verified: boolean;
}

// ========================================
// SUPPORTING TYPES
// ========================================

export interface MerkleProof {
  root: string;
  leaf: string;
  proof: string[];
  position: number[];
}

export interface ZKProof {
  proof: string;
  publicSignals: string[];
  verificationKey: string;
}

export interface MultiSignature {
  signatures: string[];
  signers: string[];
  threshold: number;
  verified: boolean;
}

export interface ControlPoint {
  id: string;
  name: string;
  type: 'validation' | 'compliance_check' | 'risk_assessment' | 'quality_check';
  condition: string;
  action: 'continue' | 'pause' | 'reject' | 'escalate';
  threshold?: number;
}

export interface MonitoringRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  action: string;
  enabled: boolean;
}

export interface FlowPerformanceMetrics {
  averageExecutionTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: number;
  costPerExecution: number;
}

export interface SLARequirements {
  availability: number; // percentage
  responseTime: number; // milliseconds
  throughput: number; // executions per hour
  errorRate: number; // percentage
  uptime: number; // percentage
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  timestamp: Date;
  details: Record<string, any>;
  evidence: string[];
}

export interface ComplianceIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  discoveredAt: Date;
}

export interface RemediationTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  effort: 'low' | 'medium' | 'high';
  dependencies: string[];
}
