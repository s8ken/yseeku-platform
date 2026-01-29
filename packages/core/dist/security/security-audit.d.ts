/**
 * Security Audit Tool
 *
 * Comprehensive cryptographic implementation security analysis
 */
export interface SecurityFinding {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'cryptography' | 'key-management' | 'data-protection' | 'implementation';
    title: string;
    description: string;
    recommendation: string;
    references?: string[];
}
export interface SecurityAuditReport {
    timestamp: number;
    overallScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    findings: SecurityFinding[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    recommendations: string[];
}
export declare class SecurityAuditor {
    private findings;
    /**
     * Perform comprehensive security audit
     */
    audit(): Promise<SecurityAuditReport>;
    private auditCryptographicImplementations;
    private testEd25519Implementation;
    private testHashChainImplementation;
    private testRandomnessQuality;
    private testAlgorithmUsage;
    private auditKeyManagement;
    private testKeyStorageSecurity;
    private testKeyRotation;
    private testKeyAccessControls;
    private auditDataProtection;
    private testDataEncryption;
    private testDataIntegrity;
    private testDataSanitization;
    private auditImplementationSecurity;
    private testErrorHandling;
    private testTimingAttacks;
    private testSideChannelAttacks;
    private addFinding;
    private generateReport;
    private calculateScore;
    private calculateGrade;
    private generateRecommendations;
}
/**
 * Run security audit
 */
export declare function runSecurityAudit(): Promise<SecurityAuditReport>;
