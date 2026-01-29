/**
 * Enterprise Compliance Reporting System
 * Generates comprehensive compliance reports for regulatory requirements
 */
import { EventEmitter } from 'events';
import { EnterpriseIntegration } from './enterprise-integration';
import { MultiTenantIsolation } from './multi-tenant-isolation';
export interface ComplianceFramework {
    name: string;
    version: string;
    requirements: ComplianceRequirement[];
    lastUpdated: Date;
}
export interface ComplianceRequirement {
    id: string;
    category: string;
    description: string;
    mandatory: boolean;
    controls: ComplianceControl[];
    evidence: ComplianceEvidence[];
    status: 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
}
export interface ComplianceControl {
    id: string;
    name: string;
    description: string;
    implementation: string;
    testing: string;
    frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    automated: boolean;
}
export interface ComplianceEvidence {
    id: string;
    type: 'log' | 'screenshot' | 'document' | 'metric' | 'test-result' | 'configuration';
    source: string;
    timestamp: Date;
    data: any;
    verified: boolean;
}
export interface ComplianceReport {
    id: string;
    framework: ComplianceFramework;
    tenantId: string;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        overallScore: number;
        compliantRequirements: number;
        totalRequirements: number;
        criticalFindings: number;
        highFindings: number;
        mediumFindings: number;
        lowFindings: number;
    };
    sections: ComplianceSection[];
    recommendations: ComplianceRecommendation[];
    generatedAt: Date;
    generatedBy: string;
    status: 'draft' | 'review' | 'approved' | 'submitted';
}
export interface ComplianceSection {
    id: string;
    category: string;
    requirements: ComplianceRequirement[];
    score: number;
    findings: ComplianceFinding[];
}
export interface ComplianceFinding {
    id: string;
    requirementId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    evidence: string[];
    recommendation: string;
    dueDate: Date;
    assignee?: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
}
export interface ComplianceRecommendation {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeline: string;
    dependencies: string[];
}
export interface ComplianceMetrics {
    totalReports: number;
    reportsByFramework: Record<string, number>;
    reportsByStatus: Record<string, number>;
    averageScore: number;
    trends: {
        monthly: Array<{
            month: string;
            score: number;
        }>;
        quarterly: Array<{
            quarter: string;
            score: number;
        }>;
    };
    criticalIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
}
export declare class ComplianceReporting extends EventEmitter {
    private frameworks;
    private reports;
    private metrics;
    private enterprise;
    private isolation;
    constructor(enterprise: EnterpriseIntegration, isolation: MultiTenantIsolation);
    private initializeMetrics;
    private loadStandardFrameworks;
    generateComplianceReport(frameworkName: string, tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<ComplianceReport>;
    private assessRequirements;
    private assessRequirement;
    private collectEvidence;
    private collectAutomatedEvidence;
    private collectManualEvidence;
    private determineComplianceStatus;
    private createSections;
    private calculateSectionScore;
    private createFindings;
    private calculateSummary;
    private generateRecommendations;
    private updateMetrics;
    private calculateTrends;
    getReport(reportId: string): ComplianceReport | undefined;
    getReportsByTenant(tenantId: string): ComplianceReport[];
    getReportsByFramework(frameworkName: string): ComplianceReport[];
    approveReport(reportId: string, approvedBy: string): Promise<void>;
    submitReport(reportId: string): Promise<void>;
    getMetrics(): ComplianceMetrics;
    getFrameworks(): ComplianceFramework[];
    addFramework(framework: ComplianceFramework): void;
}
export default ComplianceReporting;
//# sourceMappingURL=compliance-reporting.d.ts.map