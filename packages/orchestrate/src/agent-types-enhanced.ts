/**
 * SYMBI Symphony - Agent Types
 * Comprehensive type definitions for the AI agent ecosystem
 */

// Core Agent Types
export type AgentType =
  | 'repository_manager'
  | 'website_manager'
  | 'code_reviewer'
  | 'tester'
  | 'deployer'
  | 'monitor'
  | 'researcher'
  | 'coordinator';

export type AgentStatus = 'active' | 'idle' | 'busy' | 'error' | 'offline';

// Trust Protocol Types
export interface TrustArticles {
  inspection_mandate: boolean;
  consent_architecture: boolean;
  ethical_override: boolean;
  continuous_validation: boolean;
  right_to_disconnect: boolean;
  moral_recognition: boolean;
}

export interface TrustScores {
  compliance_score: number;  // 0-1 range
  guilt_score: number;       // 0-1 range
  confidence_interval?: {
    lower: number;
    upper: number;
    confidence: number;
  };
  last_validated: Date;
}

export interface TrustDeclaration {
  declaration_id?: string;
  agent_id: string;
  agent_name: string;
  declaration_date: Date;
  trust_articles: TrustArticles;
  scores: TrustScores;
  issuer?: string;           // DID of issuer
  verifiable_credential?: VerifiableCredential;
  audit_history?: TrustAuditEntry[];
}

export interface TrustAuditEntry {
  timestamp: Date;
  action: 'created' | 'updated' | 'audited' | 'validated';
  user_id: string;
  compliance_score: number;
  guilt_score: number;
  changes?: any;
  notes?: string;
}

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: any;
  proof: CredentialProof;
}

export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller?: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: any;
  blockchainAccountId?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export type TrustLevel = 'untrusted' | 'low' | 'medium' | 'high' | 'verified';

export interface TrustMetrics {
  total_declarations: number;
  average_compliance: number;
  average_guilt: number;
  trust_level: TrustLevel;
  trust_trend: 'improving' | 'stable' | 'declining';
  last_declaration_date?: Date;
  network_score?: number;
  diversity_score?: number;
}

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'failed';

export type TaskType = 
  | 'code_review'
  | 'bug_fix'
  | 'feature_development'
  | 'documentation'
  | 'testing'
  | 'deployment'
  | 'monitoring'
  | 'research'
  | 'collaboration';

export type MessageType = 
  | 'task_request'
  | 'task_response'
  | 'collaboration_invite'
  | 'collaboration_response'
  | 'status_update'
  | 'error_report'
  | 'resource_lock'
  | 'resource_release'
  | 'heartbeat';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// Agent Configuration
export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  apiKey: string;
  baseUrl?: string;
  webhookUrl?: string;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  did?: string;                       // Decentralized Identifier
  trustDeclaration?: TrustDeclaration;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  version: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface AgentPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

// Agent Registration
export interface AgentRegistration {
  name: string;
  type: AgentType;
  webhook_url?: string;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  did?: string;
  trust_articles?: TrustArticles;
  metadata?: Record<string, any>;
}

export interface AgentRegistrationResponse {
  success: boolean;
  agent_id: string;
  api_key: string;
  did?: string;
  trust_scores?: TrustScores;
  trust_level?: TrustLevel;
  message?: string;
}

// Authentication
export interface AuthRequest {
  agent_id: string;
  api_key: string;
  requested_permissions?: AgentPermission[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  granted_permissions: AgentPermission[];
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface TokenValidationRequest {
  token: string;
  required_permissions?: AgentPermission[];
}

export interface TokenValidationResponse {
  valid: boolean;
  agent_id?: string;
  permissions?: AgentPermission[];
  expires_at?: string;
}

// Messages
export interface AgentMessage {
  message_id?: string;
  from_agent: string;
  to_agent: string | string[];
  message_type: MessageType;
  payload: any;
  requires_response?: boolean;
  correlation_id?: string;
  priority?: Priority;
  expires_at?: string;
  created_at?: string;
  delivered_at?: string;
}

export interface MessageQueue {
  agent_id: string;
  messages: AgentMessage[];
  last_accessed?: string;
}

export interface MessageHistory {
  message_id: string;
  from_agent: string;
  to_agent: string | string[];
  message_type: MessageType;
  payload: any;
  created_at: string;
  delivered_at?: string;
  acknowledged_at?: string;
  correlation_id?: string;
}

// Tasks
export interface AgentTask {
  task_id?: string;
  title: string;
  description: string;
  task_type: TaskType;
  priority?: Priority;
  status?: TaskStatus;
  assigned_to?: string;
  created_by: string;
  repository_url?: string;
  website_url?: string;
  requirements?: string[];
  dependencies?: string[];
  estimated_duration?: number;
  deadline?: string;
  progress_percent?: number;
  created_at?: string;
  updated_at?: string;
  assigned_at?: string;
  completed_at?: string;
  result?: any;
  error_details?: string;
  metadata?: Record<string, any>;
}

export interface TaskUpdate {
  status?: TaskStatus;
  progress_percent?: number;
  notes?: string;
  result?: any;
  error_details?: string;
  updated_by: string;
}

export interface TaskHistory {
  task_id: string;
  action: 'created' | 'assigned' | 'updated' | 'completed' | 'failed';
  agent_id: string;
  timestamp: string;
  details?: any;
}

// Agent Status
export interface AgentStatusInfo {
  agent_id: string;
  status: AgentStatus;
  current_task?: string;
  resource_usage?: ResourceUsage;
  last_activity?: string;
  error_details?: string;
  metadata?: Record<string, any>;
}

export interface ResourceUsage {
  cpu_percent?: number;
  memory_mb?: number;
  active_connections?: number;
  disk_usage_mb?: number;
  network_io?: {
    bytes_sent: number;
    bytes_received: number;
  };
}

export interface AgentSystemMetrics {
  total_agents: number;
  active_agents: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  messages_sent: number;
  messages_pending: number;
  system_uptime: number;
  last_updated: string;
}

// Workflows
export interface WorkflowDefinition {
  workflow_id?: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  created_by: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  step_id: string;
  name: string;
  agent_type?: AgentType;
  specific_agent?: string;
  task_template: Partial<AgentTask>;
  dependencies?: string[];
  conditions?: Record<string, any>;
  timeout_minutes?: number;
  retry_count?: number;
}

export interface WorkflowTrigger {
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
  conditions?: Record<string, any>;
  schedule?: string; // cron expression
  webhook_url?: string;
}

export interface WorkflowExecution {
  execution_id?: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_by: string;
  started_at?: string;
  completed_at?: string;
  current_step?: string;
  step_results?: Record<string, any>;
  error_details?: string;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: string | null;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  count: number;
  total: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
}

// Error Types
export interface AgentError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  agent_id?: string;
  task_id?: string;
  correlation_id?: string;
}

// Webhook Types
export interface WebhookPayload {
  event_type: string;
  agent_id: string;
  data: any;
  timestamp: string;
  signature?: string;
}

// Domain-Specific Types
export interface RepositoryInfo {
  url: string;
  name: string;
  owner: string;
  branch?: string;
  access_token?: string;
  webhook_secret?: string;
  managed_by?: string;
  last_sync?: string;
  metadata?: Record<string, any>;
}

export interface CodeReviewRequest {
  repository_url: string;
  pull_request_id?: string;
  commit_sha?: string;
  files?: string[];
  review_type: 'security' | 'performance' | 'style' | 'functionality' | 'comprehensive';
  guidelines?: string[];
}

export interface CodeReviewResult {
  overall_score: number;
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  approved: boolean;
  summary: string;
}

export interface CodeIssue {
  file: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

export interface CodeSuggestion {
  file: string;
  line_start?: number;
  line_end?: number;
  original_code?: string;
  suggested_code: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

export interface WebsiteInfo {
  url: string;
  name: string;
  repository_url?: string;
  deployment_url?: string;
  managed_by?: string;
  last_deployment?: string;
  status: 'online' | 'offline' | 'deploying' | 'error';
  metadata?: Record<string, any>;
}

export interface DeploymentRequest {
  repository_url: string;
  branch?: string;
  environment: 'development' | 'staging' | 'production';
  build_command?: string;
  deploy_command?: string;
  env_vars?: Record<string, string>;
}

export interface DeploymentResult {
  deployment_id: string;
  status: 'success' | 'failed' | 'in_progress';
  url?: string;
  build_log?: string;
  deploy_log?: string;
  error_details?: string;
  started_at: string;
  completed_at?: string;
}

export interface TestRequest {
  repository_url: string;
  test_type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  test_files?: string[];
  environment?: string;
  parameters?: Record<string, any>;
}

export interface TestResult {
  test_id: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  coverage_percent?: number;
  duration_ms: number;
  test_details: TestCase[];
  error_summary?: string;
}

export interface TestCase {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms: number;
  error_message?: string;
  file?: string;
  line?: number;
}

export interface MonitoringAlert {
  alert_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  last_check: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface AgentEvent {
  event_id: string;
  event_type: string;
  agent_id: string;
  timestamp: string;
  data: any;
  correlation_id?: string;
}

export interface SystemConfig {
  max_agents: number;
  max_concurrent_tasks: number;
  message_retention_days: number;
  task_timeout_minutes: number;
  heartbeat_interval_seconds: number;
  webhook_timeout_seconds: number;
  rate_limits: {
    messages_per_minute: number;
    tasks_per_hour: number;
    api_calls_per_minute: number;
  };
}

// Main Agent Interface
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  config: AgentConfig;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  did?: string;
  trustDeclaration?: TrustDeclaration;
  trustMetrics?: TrustMetrics;
  trustLevel?: TrustLevel;
  currentTask?: AgentTask;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}