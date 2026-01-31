/**
 * Deployment Automation System
 * Automated deployment pipeline with rollbacks and monitoring
 */
import { EventEmitter } from 'events';
import { ProductionMonitoring } from './production-monitoring';
export interface DeploymentConfig {
    id: string;
    name: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    artifacts: DeploymentArtifact[];
    rollback: {
        enabled: boolean;
        strategy: 'immediate' | 'manual' | 'automatic';
        triggers: string[];
        maxAttempts: number;
    };
    testing: {
        required: boolean;
        smokeTests: string[];
        integrationTests: string[];
        performanceTests: string[];
        securityTests: string[];
    };
    monitoring: {
        healthCheckDuration: number;
        metricsThresholds: Record<string, number>;
        alerting: boolean;
    };
    approval: {
        required: boolean;
        approvers: string[];
        timeout: number;
    };
}
export interface DeploymentArtifact {
    name: string;
    type: 'docker' | 'npm' | 'file' | 'config';
    source: string;
    destination: string;
    checksum: string;
    size: number;
    permissions: string[];
}
export interface Deployment {
    id: string;
    config: DeploymentConfig;
    status: 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'rolled-back' | 'cancelled';
    phases: DeploymentPhase[];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
    metrics: {
        duration: number;
        artifactsDeployed: number;
        testsPassed: number;
        testsFailed: number;
        rollbacksPerformed: number;
    };
    logs: DeploymentLog[];
}
export interface DeploymentPhase {
    id: string;
    name: string;
    type: 'preparation' | 'backup' | 'deployment' | 'testing' | 'verification' | 'cleanup';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    steps: DeploymentStep[];
    artifacts: string[];
    logs: DeploymentLog[];
}
export interface DeploymentStep {
    id: string;
    name: string;
    command: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    exitCode?: number;
    output: string;
    error: string;
    retries: number;
    maxRetries: number;
}
export interface DeploymentLog {
    id: string;
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    phase?: string;
    step?: string;
    metadata?: Record<string, any>;
}
export interface DeploymentEnvironment {
    name: string;
    type: 'development' | 'staging' | 'production';
    config: {
        region: string;
        cluster: string;
        namespace: string;
        resources: {
            cpu: string;
            memory: string;
            storage: string;
        };
        networking: {
            loadBalancer: string;
            ingress: string[];
            certificates: string[];
        };
        security: {
            secrets: string[];
            rbac: boolean;
            networkPolicy: boolean;
        };
    };
    services: EnvironmentService[];
    status: 'active' | 'inactive' | 'maintenance';
    health: {
        overall: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    };
}
export interface EnvironmentService {
    name: string;
    version: string;
    replicas: number;
    image: string;
    ports: number[];
    endpoints: string[];
    dependencies: string[];
    healthCheck: {
        path: string;
        interval: number;
        timeout: number;
        retries: number;
    };
}
export interface DeploymentMetrics {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeploymentTime: number;
    averageRollbackTime: number;
    deploymentsByEnvironment: Record<string, number>;
    deploymentsByStatus: Record<string, number>;
    uptime: {
        last30Days: number;
        last7Days: number;
        last24Hours: number;
    };
    changeFailureRate: number;
    leadTimeForChanges: number;
}
export declare class DeploymentAutomation extends EventEmitter {
    private deployments;
    private environments;
    private activeDeployment;
    private metrics;
    private deploymentQueue;
    private monitoring;
    constructor(monitoring: ProductionMonitoring);
    private initializeMetrics;
    private setupDefaultEnvironments;
    createDeployment(config: DeploymentConfig, createdBy: string): Promise<Deployment>;
    private createDeploymentPhases;
    executeDeployment(deploymentId: string): Promise<void>;
    private executePhase;
    private executeStep;
    private mockStepExecution;
    private addDeploymentLog;
    executeRollback(deployment: Deployment): Promise<void>;
    approveDeployment(deploymentId: string, approvedBy: string): Promise<void>;
    getDeployment(deploymentId: string): Deployment | undefined;
    getDeployments(filter?: {
        environment?: string;
        status?: Deployment['status'];
        createdBy?: string;
    }): Deployment[];
    getEnvironment(name: string): DeploymentEnvironment | undefined;
    getEnvironments(): DeploymentEnvironment[];
    getMetrics(): DeploymentMetrics;
    private updateMetrics;
    getDeploymentLogs(deploymentId: string, filter?: {
        level?: DeploymentLog['level'];
        phase?: string;
        step?: string;
    }): Promise<DeploymentLog[]>;
    cancelDeployment(deploymentId: string): Promise<void>;
}
export default DeploymentAutomation;
