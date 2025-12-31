/**
 * Shared types for @sonate/lab package
 * Types for experiment orchestration and multi-agent systems
 */

// Agent Roles
export type AgentRole = 'CONDUCTOR' | 'VARIANT' | 'EVALUATOR' | 'OVERSEER';

// Message Types
export const MessageTypes = {
  EXPERIMENT_START: 'EXPERIMENT_START',
  EXPERIMENT_END: 'EXPERIMENT_END',
  TRIAL_START: 'TRIAL_START',
  TRIAL_END: 'TRIAL_END',
  EVALUATION_REQUEST: 'EVALUATION_REQUEST',
  EVALUATION_RESPONSE: 'EVALUATION_RESPONSE',
  RESPONSE: 'RESPONSE',
  ERROR: 'ERROR',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

// Agent Message
export interface AgentMessage<T = any> {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: MessageType;
  payload: T;
  experimentId: string;
  runId: string;
  trialId?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

// Message Builder
export class MessageBuilder<T = any> {
  private message: Partial<AgentMessage<T>>;

  constructor(from: AgentRole) {
    this.message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
    };
  }

  to(role: AgentRole): this {
    this.message.to = role;
    return this;
  }

  type(type: MessageType): this {
    this.message.type = type;
    return this;
  }

  payload(data: T): this {
    this.message.payload = data;
    return this;
  }

  experiment(id: string): this {
    this.message.experimentId = id;
    return this;
  }

  run(id: string): this {
    this.message.runId = id;
    return this;
  }

  trial(id: string): this {
    this.message.trialId = id;
    return this;
  }

  build(): AgentMessage<T> {
    return this.message as AgentMessage<T>;
  }
}

// Experiment Error
export class ExperimentError extends Error {
  code: string;
  experimentId?: string;
  runId?: string;

  constructor(message: string, code: string, experimentId?: string, runId?: string) {
    super(message);
    this.name = 'ExperimentError';
    this.code = code;
    this.experimentId = experimentId;
    this.runId = runId;
  }
}

// Integrity Error
export class IntegrityError extends Error {
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'IntegrityError';
    this.details = details;
  }
}

// Experiment Config
export interface ExperimentConfig {
  name: string;
  description?: string;
  variants: VariantConfig[];
  tasks: TaskConfig[];
  evaluators?: EvaluatorConfig[];
}

export interface VariantConfig {
  id: string;
  name: string;
  model: string;
  mode?: 'constitutional' | 'directive';
  config?: Record<string, any>;
}

export interface TaskConfig {
  id: string;
  input: string;
  context?: string;
  expectedQualities?: string[];
}

export interface EvaluatorConfig {
  id: string;
  type: string;
  criteria?: string[];
}

// Experiment Run
export interface ExperimentRun {
  id: string;
  experimentId: string;
  status: ExperimentStatus;
  totalTrials: number;
  completedTrials: number;
  failedTrials: number;
  randomSeed: string;
  totalCostUsd: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  trials?: Trial[];
  results?: ExperimentResults;
}

export type ExperimentStatus = 
  | 'QUEUED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

// Trial
export interface Trial {
  id: string;
  runId: string;
  taskId: string;
  status: TrialStatus;
  slotMapping?: Record<string, string>;
  responses?: TrialResponse[];
  evaluations?: Evaluation[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type TrialStatus = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface TrialResponse {
  slot: string;
  response: string;
  latencyMs: number;
  tokenCount: number;
}

// Evaluation
export interface Evaluation {
  id: string;
  evaluatorId: string;
  winnerSlot: string;
  scores: Record<string, number>;
  reasoning?: string;
  createdAt: string;
}

// Experiment Results
export interface ExperimentResults {
  winRates: Record<string, number>;
  statistical: StatisticalResult[];
  summary: string;
}

// Statistical Result
export interface StatisticalResult {
  variantId: string;
  winRate: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  effectSize?: number;
}

// SYMBI Dimension
export type SymbiDimension = 
  | 'reality_index'
  | 'trust_protocol'
  | 'ethical_alignment'
  | 'canvas_parity'
  | 'resonance_quality';

// Note: InMemoryAgentBus is exported from agent-bus.ts
// Import it directly from './agent-bus' where needed
