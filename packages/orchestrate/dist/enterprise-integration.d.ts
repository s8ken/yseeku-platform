/**
 * Enterprise Integration Framework
 * Transforms research infrastructure into enterprise-ready platform
 */
import { EventEmitter } from 'events';
export interface EnterpriseMetrics {
    totalUsers: number;
    activeSessions: number;
    apiCalls: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        storage: number;
    };
    compliance: {
        dataResidency: boolean;
        auditCoverage: number;
        securityScore: number;
    };
    performance: {
        avgResponseTime: number;
        throughput: number;
        errorRate: number;
        availability: number;
    };
}
export interface TenantConfig {
    id: string;
    name: string;
    domain: string;
    resources: {
        maxUsers: number;
        maxApiCalls: number;
        storageQuota: number;
    };
    compliance: {
        dataRegion: string;
        auditRetention: number;
        encryptionLevel: string;
    };
    customization: {
        branding: boolean;
        customWorkflows: boolean;
        integrationEndpoints: string[];
    };
}
export interface ComplianceReport {
    tenantId: string;
    period: {
        start: Date;
        end: Date;
    };
    sections: {
        dataProtection: {
            encryptedAtRest: boolean;
            encryptedInTransit: boolean;
            accessControls: boolean;
            dataResidency: boolean;
        };
        audit: {
            coverage: number;
            integrity: boolean;
            retention: boolean;
            alerts: number;
        };
        security: {
            vulnerabilities: number;
            incidents: number;
            assessments: number;
            score: number;
        };
        performance: {
            availability: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
        };
    };
    overallScore: number;
    recommendations: string[];
}
export declare class EnterpriseIntegration extends EventEmitter {
    private tenants;
    private metrics;
    private auditLog;
    private monitoringActive;
    private resourceMonitoringTimer?;
    private performanceMonitoringTimer?;
    private complianceMonitoringTimer?;
    private logger;
    constructor();
    private initializeMetrics;
    setupTenant(config: TenantConfig): Promise<void>;
    private validateTenantConfig;
    private initializeTenantIsolation;
    private setupComplianceMonitoring;
    generateComplianceReport(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<ComplianceReport>;
    private verifyDataResidency;
    private calculateAuditCoverage;
    private getAuditAlerts;
    private calculateComplianceScore;
    private generateRecommendations;
    startMonitoring(): Promise<void>;
    private startResourceMonitoring;
    private startPerformanceMonitoring;
    private startComplianceMonitoring;
    stopMonitoring(): Promise<void>;
    getMetrics(): EnterpriseMetrics;
    getTenant(tenantId: string): TenantConfig | undefined;
    getAllTenants(): TenantConfig[];
    private logAuditEvent;
    getAuditLog(tenantId?: string, limit?: number): any[];
    removeTenant(tenantId: string): Promise<void>;
    private cleanupTenantResources;
    updateTenantConfig(tenantId: string, updates: Partial<TenantConfig>): Promise<void>;
}
export default EnterpriseIntegration;
//# sourceMappingURL=enterprise-integration.d.ts.map