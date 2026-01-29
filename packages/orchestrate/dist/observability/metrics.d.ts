import { Gauge, Counter, Histogram } from 'prom-client';
export declare function initDefaultMetrics(): void;
export declare const metrics: {
    httpRequestsTotal: Counter<string>;
    httpRequestDuration: Histogram<string>;
    errorsTotal: Counter<string>;
    dbConnectionsActive: Gauge<string>;
    dbQueryDuration: Histogram<string>;
    activeAgents: Gauge<string>;
    workflowsRunning: Gauge<string>;
    trustScoreAverage: Gauge<string>;
    authAttemptsTotal: Counter<string>;
    apiKeyValidationsTotal: Counter<string>;
};
export declare function getMetrics(): Promise<string>;
export declare const recordHttpRequest: (method: string, route: string, statusCode: number, duration: number) => void;
export declare const recordError: (type: string, component: string) => void;
export declare const recordDbQuery: (operation: string, duration: number) => void;
export declare const recordAuthAttempt: (result: "success" | "failure") => void;
export declare const recordApiKeyValidation: (result: "valid" | "invalid" | "expired") => void;
export declare const updateActiveAgents: (count: number) => void;
export declare const updateWorkflowsRunning: (count: number) => void;
export declare const updateTrustScoreAverage: (score: number) => void;
//# sourceMappingURL=metrics.d.ts.map