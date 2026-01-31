/**
 * Automated Compliance Auditor
 *
 * Provides continuous compliance monitoring and automated auditing
 * for GDPR, SOC 2, ISO 27001, HIPAA, PCI DSS, and EU AI Act
 */
export interface ComplianceFramework {
    name: string;
    version: string;
    requirements: ComplianceRequirement[];
}
export interface ComplianceRequirement {
    id: string;
    name: string;
    description: string;
    category: 'data_protection' | 'access_control' | 'audit_logging' | 'incident_response' | 'risk_management';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    automatedCheck: boolean;
    checkFunction?: (context: ComplianceContext) => Promise<ComplianceCheckResult>;
}
export interface ComplianceContext {
    timestamp: number;
    tenantId?: string;
    userId?: string;
    operation: string;
    data: Record<string, any>;
    auditLog?: AuditLogEntry;
}
export interface ComplianceCheckResult {
    requirementId: string;
    passed: boolean;
    score: number;
    evidence: string[];
    violations: ComplianceViolation[];
    recommendations: string[];
}
export interface ComplianceViolation {
    requirementId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    evidence: string;
    remediation: string;
    affectedResources: string[];
}
export interface ComplianceReport {
    framework: string;
    version: string;
    timestamp: number;
    period: {
        start: number;
        end: number;
    };
    overallScore: number;
    requirements: ComplianceCheckResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        highSeverityViolations: number;
        criticalViolations: number;
    };
    recommendations: string[];
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}
export interface AuditLogEntry {
    id: string;
    timestamp: number;
    category: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
}
/**
 * Automated Compliance Auditor
 */
export declare class ComplianceAuditor {
    private frameworks;
    private auditLogs;
    private historicalScores;
    private readonly MAX_AUDIT_LOGS;
    private readonly MAX_HISTORICAL_SCORES;
    constructor();
    /**
     * Initialize compliance frameworks
     */
    private initializeFrameworks;
    /**
     * Audit a single operation for compliance
     */
    auditOperation(framework: string, context: ComplianceContext): Promise<ComplianceCheckResult[]>;
    /**
     * Generate comprehensive compliance report
     */
    generateComplianceReport(framework: string, period: {
        start: number;
        end: number;
    }, tenantId?: string): Promise<ComplianceReport>;
    /**
     * Get audit logs for period
     */
    private getAuditLogs;
    /**
     * Log audit entry
     */
    private logAudit;
    /**
     * GDPR: Data Minimization Check
     */
    private checkDataMinimization;
    /**
     * GDPR: Data Security Check
     */
    private checkDataSecurity;
    /**
     * GDPR: Data Protection by Design Check
     */
    private checkDataProtectionByDesign;
    /**
     * GDPR: Processing Records Check
     */
    private checkProcessingRecords;
    /**
     * SOC 2: Logical Access Controls Check
     */
    private checkLogicalAccessControls;
    /**
     * SOC 2: Audit Logging Check
     */
    private checkAuditLogging;
    /**
     * SOC 2: Incident Response Check
     */
    private checkIncidentResponse;
    /**
     * ISO 27001: Access Control Policy Check
     */
    private checkAccessControlPolicy;
    /**
     * ISO 27001: Backup Information Check
     */
    private checkBackupInformation;
    /**
     * EU AI Act: Data Governance Check
     */
    private checkAIDataGovernance;
    /**
     * EU AI Act: AI Transparency Check
     */
    private checkAITransparency;
    /**
     * Generate recommendations from check results
     */
    private generateRecommendations;
    /**
     * Generate overall recommendations
     */
    private generateOverallRecommendations;
    /**
     * Determine trend from historical scores
     */
    private determineTrend;
    /**
     * Get compliance status
     */
    getComplianceStatus(framework: string, tenantId?: string): Promise<{
        compliant: boolean;
        score: number;
        violations: ComplianceViolation[];
        framework: string;
    }>;
    /**
     * Clear audit logs
     */
    clearAuditLogs(tenantId?: string): void;
}
/**
 * Create compliance auditor instance
 */
export declare function createComplianceAuditor(): ComplianceAuditor;
/**
 * Global instance
 */
export declare const complianceAuditor: ComplianceAuditor;
