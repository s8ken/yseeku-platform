/**
 * Multi-Tenant Isolation System
 * Provides complete resource and data isolation between enterprise tenants
 */
import { EventEmitter } from 'events';
import { TenantConfig } from './enterprise-integration';
export interface TenantResources {
    cpu: {
        limit: number;
        usage: number;
        cores: number[];
    };
    memory: {
        limit: number;
        usage: number;
        allocation: Map<string, number>;
    };
    storage: {
        limit: number;
        usage: number;
        allocations: Map<string, number>;
    };
    network: {
        bandwidth: number;
        connections: number;
        rateLimit: number;
    };
}
export interface TenantIsolation {
    tenantId: string;
    resources: TenantResources;
    database: {
        schema: string;
        connections: number;
        poolSize: number;
    };
    filesystem: {
        rootPath: string;
        permissions: Record<string, string[]>;
        quotas: Record<string, number>;
    };
    network: {
        subnet: string;
        firewall: {
            inbound: string[];
            outbound: string[];
        };
        loadBalancer: boolean;
    };
    security: {
        encryptionKeys: string[];
        accessControls: Record<string, string[]>;
        auditIsolation: boolean;
    };
}
export interface IsolationMetrics {
    tenantCount: number;
    totalResources: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
    };
    utilizedResources: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
    };
    isolationEfficiency: number;
    securityScore: number;
    performanceImpact: number;
}
export declare class MultiTenantIsolation extends EventEmitter {
    private tenants;
    private globalLimits;
    private metrics;
    private isolationActive;
    constructor();
    private initializeGlobalLimits;
    private initializeMetrics;
    createTenantIsolation(config: TenantConfig): Promise<TenantIsolation>;
    private checkResourceAvailability;
    private calculateTotalResourceUsage;
    private allocateTenantResources;
    private createTenantDatabase;
    private createTenantFilesystem;
    private createTenantNetwork;
    private createTenantSecurity;
    removeTenantIsolation(tenantId: string): Promise<void>;
    private deallocateTenantResources;
    private cleanupTenantDatabase;
    private cleanupTenantFilesystem;
    private cleanupTenantNetwork;
    private cleanupTenantSecurity;
    getTenantIsolation(tenantId: string): TenantIsolation | undefined;
    getAllTenantIsolations(): TenantIsolation[];
    private updateMetrics;
    getMetrics(): IsolationMetrics;
    validateIsolation(tenantId: string): Promise<{
        valid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    startIsolationMonitoring(): Promise<void>;
    private startResourceMonitoring;
    private startSecurityMonitoring;
    private startPerformanceMonitoring;
    private checkResourceThresholds;
    private performSecurityCheck;
    private measurePerformance;
    stopIsolationMonitoring(): Promise<void>;
}
export default MultiTenantIsolation;
