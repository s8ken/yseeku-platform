/**
 * Shared types for @sonate/orchestrate package
 * Note: Agent, VerifiableCredential are defined in agent-types-enhanced.ts
 */
export interface WorkflowStep {
    id: string;
    step_id?: string;
    name: string;
    agent_id: string;
    action: string;
    input?: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    dependencies?: string[];
    timeout?: number;
    retryCount?: number;
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
}
export interface Proof {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}
export interface TacticalDashboard {
    active_agents: number;
    workflows_running: number;
    trust_score_avg: number;
    alerts: Alert[];
}
export interface DashboardWidget {
    id: string;
    type: 'status' | 'metric' | 'chart' | 'table' | 'alert' | 'gauge';
    title: string;
    dataSource: string;
    config?: Record<string, any>;
}
export interface Alert {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical' | 'high' | 'medium' | 'low';
    message: string;
    agent_id?: string;
    timestamp: Date | number;
    acknowledged?: boolean;
    resolvedAt?: Date;
}
export interface EnhancedTelemetry {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'ok' | 'error';
    attributes?: Record<string, any>;
    events?: TelemetryEvent[];
}
export interface TelemetryEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
}
