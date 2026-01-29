/**
 * Compliance Engine for SONATE Platform
 */
import { IndustryPolicy, TrustScore, PolicyViolation, ComplianceStatus } from '../types';
/**
 * Compliance Engine class
 */
export declare class ComplianceEngine {
    /**
     * Assess compliance status for a policy
     */
    assessCompliance(policy: IndustryPolicy, trustScore: TrustScore, violations: PolicyViolation[]): Promise<ComplianceStatus>;
    /**
     * Validate policy compliance
     */
    validatePolicyCompliance(policy: IndustryPolicy): Promise<boolean>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(policy: IndustryPolicy, trustScore: TrustScore, violations: PolicyViolation[]): Promise<ComplianceReport>;
    /**
     * Assess compliance for each framework
     */
    private assessFrameworks;
    /**
     * Assess compliance for a single framework
     */
    private assessFrameworkCompliance;
    /**
     * Check if violation is relevant to framework
     */
    private isViolationRelevantToFramework;
    /**
     * Get penalty for violation severity
     */
    private getViolationPenalty;
    /**
     * Calculate overall compliance level
     */
    private calculateOverallCompliance;
    /**
     * Calculate next audit date
     */
    private calculateNextAuditDate;
    /**
     * Validate compliance framework
     */
    private validateFramework;
    /**
     * Validate thresholds
     */
    private validateThresholds;
    /**
     * Validate rules
     */
    private validateRules;
    /**
     * Generate compliance recommendations
     */
    private generateComplianceRecommendations;
    /**
     * Generate evidence list
     */
    private generateEvidenceList;
    /**
     * Generate audit trail
     */
    private generateAuditTrail;
}
/**
 * Compliance report interface
 */
interface ComplianceReport {
    policyId: string;
    policyName: string;
    industry: string;
    reportDate: number;
    complianceStatus: ComplianceStatus;
    violations: PolicyViolation[];
    recommendations: ComplianceRecommendation[];
    evidence: EvidenceItem[];
    auditTrail: AuditTrailEntry[];
}
/**
 * Compliance recommendation interface
 */
interface ComplianceRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actions: string[];
    dueDate: number;
    framework: string;
}
/**
 * Evidence item interface
 */
interface EvidenceItem {
    type: string;
    description: string;
    retention: string;
    format: string[];
    framework: string;
    requirement: string;
}
/**
 * Audit trail entry interface
 */
interface AuditTrailEntry {
    timestamp: number;
    action: string;
    details: string;
    actor: string;
    evidence: Record<string, any>;
}
export {};
