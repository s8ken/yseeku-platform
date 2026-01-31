/**
 * Production Monitoring System
 * Comprehensive monitoring for production deployments
 */
import { EventEmitter } from 'events';
import { APIGateway } from './api-gateway';
import { AuditTrails } from './audit-trails';
import { ComplianceReporting } from './compliance-reporting';
import { EnterpriseIntegration } from './enterprise-integration';
import { MultiTenantIsolation } from './multi-tenant-isolation';
export interface ProductionMetrics {
    system: {
        uptime: number;
        cpu: {
            usage: number;
            load: number[];
            cores: number;
        };
        memory: {
            total: number;
            used: number;
            free: number;
            usage: number;
        };
        disk: {
            total: number;
            used: number;
            free: number;
            usage: number;
        };
        network: {
            inbound: number;
            outbound: number;
            connections: number;
        };
    };
    application: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        activeConnections: number;
        queueSize: number;
        cacheHitRate: number;
    };
    business: {
        activeUsers: number;
        requestsPerMinute: number;
        conversionRate: number;
        revenue: number;
        retention: number;
    };
    compliance: {
        auditCoverage: number;
        securityScore: number;
        complianceScore: number;
        dataResidency: boolean;
    };
}
export interface ProductionAlert {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'system' | 'application' | 'business' | 'security' | 'compliance';
    title: string;
    description: string;
    timestamp: Date;
    source: string;
    metrics: {
        current: number;
        threshold: number;
        unit: string;
    };
    affectedSystems: string[];
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    actions: string[];
}
export interface ProductionDashboard {
    id: string;
    name: string;
    widgets: ProductionDashboardWidget[];
    refreshInterval: number;
    autoRefresh: boolean;
    filters: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface ProductionDashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert' | 'status' | 'gauge';
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        metric?: string;
        chartType?: 'line' | 'bar' | 'pie' | 'gauge';
        timeRange?: string;
        filters?: Record<string, any>;
        refreshInterval?: number;
    };
    dataSource: string;
}
export interface HealthCheck {
    component: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    responseTime: number;
    lastCheck: Date;
    details: Record<string, any>;
    dependencies: string[];
}
export declare class ProductionMonitoring extends EventEmitter {
    private metrics;
    private alerts;
    private dashboards;
    private healthChecks;
    private monitoringActive;
    private alertThresholds;
    private components;
    constructor(components: {
        enterprise: EnterpriseIntegration;
        isolation: MultiTenantIsolation;
        gateway: APIGateway;
        compliance: ComplianceReporting;
        audit: AuditTrails;
    });
    private initializeMetrics;
    private setupAlertThresholds;
    private setupDefaultDashboard;
    startMonitoring(): Promise<void>;
    private startSystemMonitoring;
    private startApplicationMonitoring;
    private startBusinessMonitoring;
    private startComplianceMonitoring;
    private startHealthChecks;
    private updateSystemMetrics;
    private updateApplicationMetrics;
    private updateBusinessMetrics;
    private updateComplianceMetrics;
    private checkSystemAlerts;
    private checkApplicationAlerts;
    private checkBusinessAlerts;
    private checkComplianceAlerts;
    private createAlert;
    private performHealthChecks;
    stopMonitoring(): Promise<void>;
    getMetrics(): ProductionMetrics;
    getAlerts(filter?: {
        severity?: ProductionAlert['severity'];
        category?: ProductionAlert['category'];
        acknowledged?: boolean;
        resolved?: boolean;
    }): ProductionAlert[];
    acknowledgeAlert(alertId: string, acknowledgedBy: string): void;
    resolveAlert(alertId: string, resolvedBy: string): void;
    getDashboards(): ProductionDashboard[];
    getDashboard(id: string): ProductionDashboard | undefined;
    createDashboard(dashboard: Omit<ProductionDashboard, 'id' | 'createdAt' | 'updatedAt'>): ProductionDashboard;
    getHealthChecks(): HealthCheck[];
    getHealthCheck(component: string): HealthCheck | undefined;
}
export default ProductionMonitoring;
