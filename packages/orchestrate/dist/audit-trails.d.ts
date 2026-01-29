/**
 * Enterprise Audit Trails System
 * Comprehensive audit logging and tracking for compliance and security
 */
import { EventEmitter } from 'events';
import { EnterpriseIntegration } from './enterprise-integration';
import { MultiTenantIsolation } from './multi-tenant-isolation';
export interface AuditEvent {
    id: string;
    tenantId?: string;
    userId?: string;
    sessionId?: string;
    timestamp: Date;
    category: AuditCategory;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details: Record<string, any>;
    source: {
        component: string;
        method: string;
        ip?: string;
        userAgent?: string;
    };
    outcome: 'success' | 'failure' | 'error' | 'partial';
    risk: {
        level: 'none' | 'low' | 'medium' | 'high' | 'critical';
        score: number;
        factors: string[];
    };
    compliance: {
        frameworks: string[];
        requirements: string[];
        retention: number;
    };
    metadata: {
        requestId?: string;
        correlationId?: string;
        duration?: number;
        dataSize?: number;
        affectedRecords?: number;
    };
}
export type AuditCategory = 'authentication' | 'authorization' | 'data-access' | 'data-modification' | 'system-config' | 'security' | 'compliance' | 'performance' | 'user-management' | 'tenant-management' | 'api-access' | 'error-handling' | 'backup-recovery';
export interface AuditFilter {
    tenantId?: string;
    userId?: string;
    category?: AuditCategory;
    severity?: AuditEvent['severity'];
    type?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    outcome?: AuditEvent['outcome'];
    riskLevel?: AuditEvent['risk']['level'];
    complianceFrameworks?: string[];
    searchText?: string;
    limit?: number;
    offset?: number;
}
export interface AuditSummary {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    riskDistribution: Record<string, number>;
    complianceCoverage: Record<string, number>;
    trends: {
        daily: Array<{
            date: string;
            count: number;
        }>;
        hourly: Array<{
            hour: number;
            count: number;
        }>;
    };
    topUsers: Array<{
        userId: string;
        eventCount: number;
    }>;
    topSources: Array<{
        source: string;
        eventCount: number;
    }>;
    anomalies: AuditAnomaly[];
}
export interface AuditAnomaly {
    id: string;
    type: 'spike' | 'pattern' | 'unusual-access' | 'security-breach' | 'compliance-violation';
    description: string;
    severity: AuditEvent['severity'];
    detectedAt: Date;
    affectedEvents: string[];
    riskScore: number;
    recommendations: string[];
}
export interface AuditRetention {
    category: AuditCategory;
    retentionPeriod: number;
    complianceRequirements: string[];
    archivalLocation: string;
    encryptionRequired: boolean;
    accessRestricted: boolean;
}
export interface AuditMetrics {
    totalEvents: number;
    storageUsed: number;
    storageAllocated: number;
    eventsPerSecond: number;
    averageProcessingTime: number;
    failedEvents: number;
    archivedEvents: number;
    complianceScore: number;
    retentionCompliance: number;
}
export declare class AuditTrails extends EventEmitter {
    private events;
    private retention;
    private metrics;
    private archiveEvents;
    private monitoringActive;
    private enterprise;
    private isolation;
    constructor(enterprise: EnterpriseIntegration, isolation: MultiTenantIsolation);
    private initializeMetrics;
    private setupRetentionPolicies;
    logEvent(event: Partial<AuditEvent>): Promise<string>;
    private validateEvent;
    private updateMetrics;
    private calculateEventsPerSecond;
    queryEvents(filter: AuditFilter): Promise<{
        events: AuditEvent[];
        total: number;
        hasMore: boolean;
    }>;
    generateAuditSummary(filter?: AuditFilter): Promise<AuditSummary>;
    private calculateTrends;
    private calculateTopUsers;
    private calculateTopSources;
    detectAnomalies(events: AuditEvent[]): Promise<AuditAnomaly[]>;
    private detectActivitySpikes;
    private detectUnusualAccess;
    private detectSecurityBreaches;
    private detectComplianceViolations;
    private checkForAnomalies;
    private performRetentionCleanup;
    startMonitoring(): Promise<void>;
    private startRealTimeMonitoring;
    private startRetentionMonitoring;
    private startPerformanceMonitoring;
    private updateRetentionCompliance;
    stopMonitoring(): Promise<void>;
    getMetrics(): AuditMetrics;
    getRetentionPolicies(): AuditRetention[];
    updateRetentionPolicy(category: AuditCategory, policy: Partial<AuditRetention>): void;
    exportEvents(filter: AuditFilter, format?: 'json' | 'csv' | 'xml'): Promise<string>;
    private convertToCSV;
    private convertToXML;
}
export default AuditTrails;
//# sourceMappingURL=audit-trails.d.ts.map