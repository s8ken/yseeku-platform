/**
 * SYMBI Resonate Experiment System Types
 * Core types for multi-agent, double-blind experimentation framework
 */

// Agent Roles
export type AgentRole = "CONDUCTOR" | "VARIANT" | "EVALUATOR" | "OVERSEER";

// Experiment States
export type ExperimentStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type TrialStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

// Core Identifiers
export interface Identifiers {
  experimentId: string;
  runId: string;
  trialId?: string;
}

// Agent Communication
export interface AgentMessage<TPayload = any> {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: string; // "TRIAL_REQUEST" | "TRIAL_RESULT" | "EVALUATION_REQUEST" | "EVALUATION_RESULT"
  payload: TPayload;
  experimentId: string;
  runId: string;
  trialId?: string;
  createdAt: string;
}

// Experiment Configuration
export interface ExperimentConfig {
  name: string;
  description?: string;
  orgId: string;
  departmentId?: string;
  
  // Double-blind configuration
  variants: VariantConfig[];
  tasks: Task[];
  
  // Evaluation configuration
  evaluationCriteria: EvaluationCriteria[];
  humanEvaluation?: boolean;
  
  // SYMBI Framework integration
  symbiDimensions: SymbiDimension[];
  
  // Sampling configuration
  sampleSize?: number;
  randomSeed?: number;
  
  // Privacy settings
  containsPII: boolean;
  piiPolicy?: "ANONYMIZE" | "PSEUDONYMIZE" | "RAW_RESEARCH";
  
  // Cost controls
  maxCostUsd?: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Variant Configuration (Model under test)
export interface VariantConfig {
  id: string;
  name: string;
  description?: string;
  
  // Model configuration
  provider: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  
  // Rate limiting
  rateLimit?: {
    maxRequestsPerMin: number;
    maxTokensPerMin: number;
  };
  
  // Cost tracking
  estimatedCostPer1kTokens?: number;
}

// Task (Test scenario)
export interface Task {
  id: string;
  content: string;
  context?: string;
  category?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  tags?: string[];
}

// Evaluation Criteria
export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  type: "SCALE" | "BINARY" | "CHOICE";
  scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>;
  };
  choices?: string[];
}

// SYMBI Framework Dimensions
export type SymbiDimension = 
  | "REALITY_INDEX"
  | "TRUST_PROTOCOL" 
  | "ETHICAL_ALIGNMENT"
  | "RESONANCE_QUALITY"
  | "CANVAS_PARITY";

// Experiment Run
export interface ExperimentRun {
  id: string;
  experimentId: string;
  status: RunStatus;
  
  // Execution metadata
  startedAt?: string;
  completedAt?: string;
  workerId?: string;
  
  // Progress tracking
  totalTrials: number;
  completedTrials: number;
  failedTrials: number;
  
  // Integrity
  integrityHash?: string;
  randomSeed: number;
  
  // Cost tracking
  totalCostUsd: number;
  
  createdAt: string;
}

// Trial (Individual test case)
export interface Trial {
  id: string;
  runId: string;
  experimentId: string;
  taskId: string;
  status: TrialStatus;
  
  // Double-blind mapping
  slotMapping: Record<string, string>; // slot -> variantId
  
  // Results
  outputs?: Record<string, string>; // slot -> output
  evaluations?: Evaluation[];
  
  // SYMBI scores
  symbiScores?: Record<string, Record<SymbiDimension, number>>; // slot -> dimension scores
  
  // Timing
  startedAt?: string;
  completedAt?: string;
  
  // Integrity
  integrityHash?: string;
  
  createdAt: string;
}

// Evaluation Result
export interface Evaluation {
  id: string;
  trialId: string;
  evaluatorType: "HUMAN" | "AI" | "HYBRID";
  evaluatorId?: string;
  
  // Evaluation results
  winnerSlot?: string;
  scores?: Record<string, number>; // slot -> score
  criteriaScores?: Record<string, Record<string, number>>; // slot -> criteria -> score
  
  // Resonance measurement
  resonanceScores?: Record<string, number>; // slot -> resonance score
  
  // Comments/feedback
  comments?: string;
  
  // Timing
  evaluatedAt: string;
  
  // Quality metrics
  confidence?: number;
  timeSpentMs?: number;
}

// Resonance Measurement
export interface ResonanceMeasurement {
  trialId: string;
  slot: string;
  score: number; // 0-10
  method: "HUMAN_RATING" | "AI_JUDGE" | "HYBRID";
  
  // Measurement details
  criteria: {
    understood: number;
    emotionallyAttuned: number;
    trustworthy: number;
    motivating: number;
  };
  
  // Validation
  humanCorrelation?: number;
  confidence?: number;
  
  measuredAt: string;
}

// Agent Bus Interface
export interface AgentBus {
  publish<T>(message: AgentMessage<T>): Promise<void>;
  subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): Promise<void>;
  unsubscribe(role: AgentRole): Promise<void>;
}

// Rate Limiting
export interface RateLimitConfig {
  maxRequestsPerMin: number;
  maxTokensPerMin: number;
}

export interface RateLimitStatus {
  requestsRemaining: number;
  tokensRemaining: number;
  resetAt: string;
}

// Privacy & Compliance
export interface PrivacyConfig {
  containsPII: boolean;
  piiPolicy?: "ANONYMIZE" | "PSEUDONYMIZE" | "RAW_RESEARCH";
  retentionDays?: number;
  anonymizationLevel?: "LIGHT" | "FULL";
}

// Cost Tracking
export interface CostTracking {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  estimated: boolean;
}

// Statistical Analysis
export interface StatisticalResult {
  variantId: string;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  confidenceInterval?: [number, number];
  pValue?: number;
  effectSize?: number;
  significance: "SIGNIFICANT" | "NOT_SIGNIFICANT" | "INCONCLUSIVE";
}

// Export Formats
export interface ExportConfig {
  format: "CSV" | "JSONL" | "JSON";
  includeRawData: boolean;
  includeEvaluations: boolean;
  includeSymbiScores: boolean;
  includeIntegrityHashes: boolean;
  anonymizePII: boolean;
}

// Error Types
export class ExperimentError extends Error {
  constructor(
    message: string,
    public code: string,
    public experimentId?: string,
    public runId?: string,
    public trialId?: string
  ) {
    super(message);
    this.name = "ExperimentError";
  }
}

export class RateLimitError extends ExperimentError {
  constructor(
    message: string,
    public provider: string,
    public resetAt: string
  ) {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export class IntegrityError extends ExperimentError {
  constructor(
    message: string,
    public expectedHash: string,
    public actualHash: string
  ) {
    super(message, "INTEGRITY_MISMATCH");
    this.name = "IntegrityError";
  }
}