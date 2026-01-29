/**
 * SONATE Resonate Experiment System Types
 * Core types for multi-agent, double-blind experimentation framework
 */
export type AgentRole = 'CONDUCTOR' | 'VARIANT' | 'EVALUATOR' | 'OVERSEER';
export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TrialStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export interface Identifiers {
    experimentId: string;
    runId: string;
    trialId?: string;
}
export interface AgentMessage<TPayload = any> {
    id: string;
    from: AgentRole;
    to: AgentRole;
    type: string;
    payload: TPayload;
    experimentId: string;
    runId: string;
    trialId?: string;
    createdAt: string;
}
export interface ExperimentConfig {
    name: string;
    description?: string;
    orgId: string;
    departmentId?: string;
    variants: VariantConfig[];
    tasks: Task[];
    evaluationCriteria: EvaluationCriteria[];
    humanEvaluation?: boolean;
    sonateDimensions: SonateDimension[];
    sampleSize?: number;
    randomSeed?: number;
    containsPII: boolean;
    piiPolicy?: 'ANONYMIZE' | 'PSEUDONYMIZE' | 'RAW_RESEARCH';
    maxCostUsd?: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface VariantConfig {
    id: string;
    name: string;
    description?: string;
    provider: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    rateLimit?: {
        maxRequestsPerMin: number;
        maxTokensPerMin: number;
    };
    estimatedCostPer1kTokens?: number;
}
export interface Task {
    id: string;
    content: string;
    context?: string;
    category?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    tags?: string[];
}
export interface EvaluationCriteria {
    id: string;
    name: string;
    description: string;
    type: 'SCALE' | 'BINARY' | 'CHOICE';
    scale?: {
        min: number;
        max: number;
        labels?: Record<number, string>;
    };
    choices?: string[];
}
export type SonateDimension = 'REALITY_INDEX' | 'TRUST_PROTOCOL' | 'ETHICAL_ALIGNMENT' | 'RESONANCE_QUALITY' | 'CANVAS_PARITY';
export interface ExperimentRun {
    id: string;
    experimentId: string;
    status: RunStatus;
    startedAt?: string;
    completedAt?: string;
    workerId?: string;
    totalTrials: number;
    completedTrials: number;
    failedTrials: number;
    integrityHash?: string;
    randomSeed: number;
    totalCostUsd: number;
    createdAt: string;
}
export interface Trial {
    id: string;
    runId: string;
    experimentId: string;
    taskId: string;
    status: TrialStatus;
    slotMapping: Record<string, string>;
    outputs?: Record<string, string>;
    evaluations?: Evaluation[];
    sonateScores?: Record<string, Record<SonateDimension, number>>;
    startedAt?: string;
    completedAt?: string;
    integrityHash?: string;
    createdAt: string;
}
export interface Evaluation {
    id: string;
    trialId: string;
    evaluatorType: 'HUMAN' | 'AI' | 'HYBRID';
    evaluatorId?: string;
    winnerSlot?: string;
    scores?: Record<string, number>;
    criteriaScores?: Record<string, Record<string, number>>;
    resonanceScores?: Record<string, number>;
    comments?: string;
    evaluatedAt: string;
    confidence?: number;
    timeSpentMs?: number;
}
export interface ResonanceMeasurement {
    trialId: string;
    slot: string;
    score: number;
    method: 'HUMAN_RATING' | 'AI_JUDGE' | 'HYBRID';
    criteria: {
        understood: number;
        emotionallyAttuned: number;
        trustworthy: number;
        motivating: number;
    };
    humanCorrelation?: number;
    confidence?: number;
    measuredAt: string;
}
export interface AgentBus {
    publish<T>(message: AgentMessage<T>): Promise<void>;
    subscribe(role: AgentRole, handler: (message: AgentMessage) => Promise<void>): Promise<void>;
    unsubscribe(role: AgentRole): Promise<void>;
}
export interface RateLimitConfig {
    maxRequestsPerMin: number;
    maxTokensPerMin: number;
}
export interface RateLimitStatus {
    requestsRemaining: number;
    tokensRemaining: number;
    resetAt: string;
}
export interface PrivacyConfig {
    containsPII: boolean;
    piiPolicy?: 'ANONYMIZE' | 'PSEUDONYMIZE' | 'RAW_RESEARCH';
    retentionDays?: number;
    anonymizationLevel?: 'LIGHT' | 'FULL';
}
export interface CostTracking {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
    estimated: boolean;
}
export interface StatisticalResult {
    variantId: string;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    confidenceInterval?: [number, number];
    pValue?: number;
    effectSize?: number;
    significance: 'SIGNIFICANT' | 'NOT_SIGNIFICANT' | 'INCONCLUSIVE';
}
export interface ExportConfig {
    format: 'CSV' | 'JSONL' | 'JSON';
    includeRawData: boolean;
    includeEvaluations: boolean;
    includeSonateScores: boolean;
    includeIntegrityHashes: boolean;
    anonymizePII: boolean;
}
export declare class ExperimentError extends Error {
    code: string;
    experimentId?: string | undefined;
    runId?: string | undefined;
    trialId?: string | undefined;
    constructor(message: string, code: string, experimentId?: string | undefined, runId?: string | undefined, trialId?: string | undefined);
}
export declare class RateLimitError extends ExperimentError {
    provider: string;
    resetAt: string;
    constructor(message: string, provider: string, resetAt: string);
}
export declare class IntegrityError extends ExperimentError {
    expectedHash: string;
    actualHash: string;
    constructor(message: string, expectedHash: string, actualHash: string);
}
//# sourceMappingURL=experiment-types.d.ts.map