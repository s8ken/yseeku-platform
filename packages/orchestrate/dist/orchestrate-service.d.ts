/**
 * OrchestrateService - Composition Layer for Yseeku SONATE Platform
 * Integrates SYMPHONY (metrics/detection) and SYNERGY (agents/trust) into unified governance
 */
import { EventEmitter } from 'events';
import { Policy, TrustReceipt, ComplianceSnapshot, PolicyRule, ComplianceStatus } from './domain-models';
export interface OrchestrateServiceConfig {
    symphonyEndpoint?: string;
    synergyEndpoint?: string;
    enableRealTimeSync: boolean;
    cacheTimeout: number;
    retryAttempts: number;
    auditLogging: boolean;
}
export interface GovernanceContext {
    tenantId: string;
    userId: string;
    sessionId: string;
    timestamp: Date;
    correlationId: string;
}
export interface ComplianceCheckRequest {
    context: GovernanceContext;
    entityId: string;
    entityType: 'agent' | 'workflow' | 'policy';
    frameworks: string[];
    evidenceRequired: boolean;
}
export interface PolicyEnforcementRequest {
    context: GovernanceContext;
    policyId: string;
    entity: {
        id: string;
        type: 'agent' | 'workflow' | 'user';
        attributes: Record<string, any>;
    };
    action: string;
    parameters: Record<string, any>;
}
export interface FlowExecutionRequest {
    context: GovernanceContext;
    flowId: string;
    input: any;
    executionMode: 'automatic' | 'supervised' | 'sandbox';
    priority: number;
}
export declare class OrchestrateService extends EventEmitter {
    private config;
    private symphonyClient?;
    private synergyClient?;
    private trustProtocol;
    private policyCache;
    private flowCache;
    private complianceCache;
    constructor(config: OrchestrateServiceConfig);
    private initializeClients;
    /**
     * Create and validate a new governance policy
     */
    createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy>;
    /**
     * Evaluate policy against entity and determine enforcement actions
     */
    enforcePolicy(request: PolicyEnforcementRequest): Promise<{
        allowed: boolean;
        violations: PolicyRule[];
        actions: string[];
        trustReceipt: TrustReceipt;
    }>;
    /**
     * Get active policies for an entity
     */
    getApplicablePolicies(entityId: string, entityType: string): Promise<Policy[]>;
    /**
     * Execute a governance flow with full compliance and monitoring
     */
    executeFlow(request: FlowExecutionRequest): Promise<{
        executionId: string;
        status: string;
        results: any;
        compliance: ComplianceStatus;
        trustReceipt: TrustReceipt;
    }>;
    /**
     * Monitor active flow execution and intervene when necessary
     */
    monitorFlowExecution(executionId: string): Promise<{
        status: string;
        currentTask?: string;
        metrics: any;
        interventions: any[];
        recommendations: string[];
    }>;
    /**
     * Generate comprehensive compliance snapshot
     */
    generateComplianceSnapshot(request: {
        context: GovernanceContext;
        frameworks: string[];
        period: {
            start: Date;
            end: Date;
        };
    }): Promise<ComplianceSnapshot>;
    /**
     * Real-time compliance monitoring for operations
     */
    checkCompliance(request: ComplianceCheckRequest): Promise<{
        compliant: boolean;
        score: number;
        violations: any[];
        requirements: any[];
    }>;
    /**
     * Verify trust receipt chain integrity
     */
    verifyTrustReceiptChain(receiptId: string): Promise<{
        valid: boolean;
        receipt: TrustReceipt;
        chain: TrustReceipt[];
        violations: string[];
    }>;
    /**
     * Generate compliance report from trust receipts
     */
    generateComplianceReport(request: {
        context: GovernanceContext;
        period: {
            start: Date;
            end: Date;
        };
        frameworks: string[];
    }): Promise<{
        reportId: string;
        summary: any;
        receipts: TrustReceipt[];
        compliance: ComplianceSnapshot;
        evidence: any[];
    }>;
    private validatePolicyStructure;
    private checkPolicyConflicts;
    private policiesConflict;
    private evaluateRule;
    private isPolicyApplicable;
    private checkFlowCompliance;
    private assessFlowRisk;
    private executeFlowWithMonitoring;
    private assessFrameworkCompliance;
    private generateComplianceInsights;
    private generateComplianceRecommendations;
    private generatePolicyTrustReceipt;
    private generateComplianceTrustReceipt;
    private storePolicy;
    private getPolicy;
    private getAllPolicies;
    private getFlow;
    private getTrustReceipt;
    private getTrustReceiptByHash;
    private getTrustReceiptsByPeriod;
    private collectComplianceEvidence;
    private checkFrameworkCompliance;
    private invalidatePolicyCache;
    private generateId;
}
//# sourceMappingURL=orchestrate-service.d.ts.map