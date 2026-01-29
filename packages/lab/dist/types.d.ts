/**
 * Shared types for @sonate/lab package
 * Types for experiment orchestration and multi-agent systems
 */
export type AgentRole = 'CONDUCTOR' | 'VARIANT' | 'EVALUATOR' | 'OVERSEER';
export declare const MessageTypes: {
    readonly EXPERIMENT_START: "EXPERIMENT_START";
    readonly EXPERIMENT_END: "EXPERIMENT_END";
    readonly TRIAL_START: "TRIAL_START";
    readonly TRIAL_END: "TRIAL_END";
    readonly EVALUATION_REQUEST: "EVALUATION_REQUEST";
    readonly EVALUATION_RESPONSE: "EVALUATION_RESPONSE";
    readonly RESPONSE: "RESPONSE";
    readonly ERROR: "ERROR";
};
export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];
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
export declare class MessageBuilder<T = any> {
    private message;
    constructor(from: AgentRole);
    to(role: AgentRole): this;
    type(type: MessageType): this;
    payload(data: T): this;
    experiment(id: string): this;
    run(id: string): this;
    trial(id: string): this;
    build(): AgentMessage<T>;
}
export declare class ExperimentError extends Error {
    code: string;
    experimentId?: string;
    runId?: string;
    constructor(message: string, code: string, experimentId?: string, runId?: string);
}
export declare class IntegrityError extends Error {
    details: any;
    constructor(message: string, details?: any);
}
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
export type ExperimentStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
export type TrialStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export interface TrialResponse {
    slot: string;
    response: string;
    latencyMs: number;
    tokenCount: number;
}
export interface Evaluation {
    id: string;
    evaluatorId: string;
    winnerSlot: string;
    scores: Record<string, number>;
    reasoning?: string;
    createdAt: string;
}
export interface ExperimentResults {
    winRates: Record<string, number>;
    statistical: StatisticalResult[];
    summary: string;
}
export interface StatisticalResult {
    variantId: string;
    winRate: number;
    confidenceInterval: [number, number];
    pValue: number;
    isSignificant: boolean;
    effectSize?: number;
}
export type SonateDimension = 'reality_index' | 'trust_protocol' | 'ethical_alignment' | 'canvas_parity' | 'resonance_quality';
//# sourceMappingURL=types.d.ts.map