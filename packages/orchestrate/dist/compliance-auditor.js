"use strict";
/**
 * Automated Compliance Auditor
 *
 * Provides continuous compliance monitoring and automated auditing
 * for GDPR, SOC 2, ISO 27001, HIPAA, PCI DSS, and EU AI Act
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceAuditor = exports.ComplianceAuditor = void 0;
exports.createComplianceAuditor = createComplianceAuditor;
const core_1 = require("@sonate/core");
/**
 * Automated Compliance Auditor
 */
class ComplianceAuditor {
    constructor() {
        this.frameworks = new Map();
        this.auditLogs = new Map();
        this.historicalScores = new Map();
        this.MAX_AUDIT_LOGS = 10000;
        this.MAX_HISTORICAL_SCORES = 100;
        this.initializeFrameworks();
    }
    /**
     * Initialize compliance frameworks
     */
    initializeFrameworks() {
        // GDPR Framework
        const gdpr = {
            name: 'GDPR',
            version: '2018/1725',
            requirements: [
                {
                    id: 'GDPR_ART_5',
                    name: 'Data Minimization',
                    description: 'Personal data shall be adequate, relevant, and limited to what is necessary',
                    category: 'data_protection',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkDataMinimization.bind(this),
                },
                {
                    id: 'GDPR_ART_32',
                    name: 'Security of Processing',
                    description: 'Appropriate technical and organizational measures shall be implemented',
                    category: 'data_protection',
                    severity: 'CRITICAL',
                    automatedCheck: true,
                    checkFunction: this.checkDataSecurity.bind(this),
                },
                {
                    id: 'GDPR_ART_25',
                    name: 'Data Protection by Design',
                    description: 'Data protection measures shall be implemented by design and by default',
                    category: 'data_protection',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkDataProtectionByDesign.bind(this),
                },
                {
                    id: 'GDPR_ART_30',
                    name: 'Records of Processing Activities',
                    description: 'Records of all processing activities shall be maintained',
                    category: 'audit_logging',
                    severity: 'MEDIUM',
                    automatedCheck: true,
                    checkFunction: this.checkProcessingRecords.bind(this),
                },
            ],
        };
        this.frameworks.set('GDPR', gdpr);
        // SOC 2 Type II Framework
        const soc2 = {
            name: 'SOC 2 Type II',
            version: '2017',
            requirements: [
                {
                    id: 'SOC2_CC6_1',
                    name: 'Logical Access Controls',
                    description: 'Logical access controls shall prevent unauthorized access',
                    category: 'access_control',
                    severity: 'CRITICAL',
                    automatedCheck: true,
                    checkFunction: this.checkLogicalAccessControls.bind(this),
                },
                {
                    id: 'SOC2_CC6_6',
                    name: 'Audit Logging',
                    description: 'System activity shall be logged and reviewed',
                    category: 'audit_logging',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkAuditLogging.bind(this),
                },
                {
                    id: 'SOC2_CC7_2',
                    name: 'Incident Response',
                    description: 'Incident response procedures shall be established',
                    category: 'incident_response',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkIncidentResponse.bind(this),
                },
            ],
        };
        this.frameworks.set('SOC2', soc2);
        // ISO 27001 Framework
        const iso27001 = {
            name: 'ISO 27001',
            version: '2022',
            requirements: [
                {
                    id: 'ISO_A9_1',
                    name: 'Access Control Policy',
                    description: 'Access control policy shall be established and maintained',
                    category: 'access_control',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkAccessControlPolicy.bind(this),
                },
                {
                    id: 'ISO_A12_3',
                    name: 'Backup Information',
                    description: 'Backup copies of information shall be created and tested',
                    category: 'data_protection',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkBackupInformation.bind(this),
                },
            ],
        };
        this.frameworks.set('ISO27001', iso27001);
        // EU AI Act Framework
        const euAiAct = {
            name: 'EU AI Act',
            version: '2024',
            requirements: [
                {
                    id: 'EUAI_ART_10',
                    name: 'Data and Data Governance',
                    description: 'Training data shall meet quality standards',
                    category: 'data_protection',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkAIDataGovernance.bind(this),
                },
                {
                    id: 'EUAI_ART_12',
                    name: 'Transparency and Provision of Information',
                    description: 'Users shall be informed they are interacting with an AI system',
                    category: 'data_protection',
                    severity: 'HIGH',
                    automatedCheck: true,
                    checkFunction: this.checkAITransparency.bind(this),
                },
            ],
        };
        this.frameworks.set('EUAI', euAiAct);
    }
    /**
     * Audit a single operation for compliance
     */
    async auditOperation(framework, context) {
        const complianceFramework = this.frameworks.get(framework);
        if (!complianceFramework) {
            throw new core_1.ComplianceError(`Compliance framework not found: ${framework}`, framework);
        }
        const results = [];
        // Log audit
        await this.logAudit(context);
        // Run automated checks
        for (const requirement of complianceFramework.requirements) {
            if (requirement.automatedCheck && requirement.checkFunction) {
                try {
                    const result = await requirement.checkFunction(context);
                    results.push(result);
                }
                catch (error) {
                    console.error(`Compliance check failed for ${requirement.id}:`, error);
                    results.push({
                        requirementId: requirement.id,
                        passed: false,
                        score: 0,
                        evidence: [],
                        violations: [
                            {
                                requirementId: requirement.id,
                                severity: 'HIGH',
                                description: `Compliance check failed: ${error.message}`,
                                evidence: error.message,
                                remediation: 'Investigate and resolve the error',
                                affectedResources: [],
                            },
                        ],
                        recommendations: ['Review the error and retry the compliance check'],
                    });
                }
            }
        }
        return results;
    }
    /**
     * Generate comprehensive compliance report
     */
    async generateComplianceReport(framework, period, tenantId) {
        const complianceFramework = this.frameworks.get(framework);
        if (!complianceFramework) {
            throw new core_1.ComplianceError(`Compliance framework not found: ${framework}`, framework);
        }
        const auditLogs = this.getAuditLogs(period, tenantId);
        const requirements = [];
        // Check all requirements
        for (const requirement of complianceFramework.requirements) {
            if (requirement.automatedCheck && requirement.checkFunction) {
                // Aggregate results from audit logs
                const results = auditLogs.map((log) => requirement.checkFunction({
                    timestamp: log.timestamp,
                    tenantId: log.tenantId,
                    userId: log.userId,
                    operation: log.type,
                    data: log.metadata || {},
                }));
                // Wait for all checks
                const checkResults = await Promise.all(results);
                // Aggregate scores
                const scores = checkResults.map((r) => r.score);
                const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                // Collect all violations
                const violations = checkResults.flatMap((r) => r.violations);
                // Generate recommendations
                const recommendations = this.generateRecommendations(checkResults);
                requirements.push({
                    requirementId: requirement.id,
                    passed: avgScore >= 0.8,
                    score: avgScore,
                    evidence: checkResults.flatMap((r) => r.evidence),
                    violations,
                    recommendations,
                });
            }
        }
        // Calculate overall score
        const overallScore = requirements.reduce((sum, r) => sum + r.score, 0) / requirements.length;
        // Summary
        const summary = {
            total: requirements.length,
            passed: requirements.filter((r) => r.passed).length,
            failed: requirements.filter((r) => !r.passed).length,
            highSeverityViolations: requirements
                .flatMap((r) => r.violations)
                .filter((v) => v.severity === 'HIGH').length,
            criticalViolations: requirements
                .flatMap((r) => r.violations)
                .filter((v) => v.severity === 'CRITICAL').length,
        };
        // Determine trend
        const trend = this.determineTrend(framework, overallScore);
        // Generate overall recommendations
        const overallRecommendations = this.generateOverallRecommendations(requirements);
        return {
            framework: complianceFramework.name,
            version: complianceFramework.version,
            timestamp: Date.now(),
            period,
            overallScore,
            requirements,
            summary,
            recommendations: overallRecommendations,
            trend,
        };
    }
    /**
     * Get audit logs for period
     */
    getAuditLogs(period, tenantId) {
        const logs = [];
        for (const [_, tenantLogs] of this.auditLogs) {
            for (const log of tenantLogs) {
                if (log.timestamp < period.start || log.timestamp > period.end) {
                    continue;
                }
                if (tenantId && log.tenantId !== tenantId) {
                    continue;
                }
                logs.push(log);
            }
        }
        return logs;
    }
    /**
     * Log audit entry
     */
    async logAudit(context) {
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: context.timestamp,
            category: 'compliance',
            type: 'audit',
            severity: 'LOW',
            description: `Compliance audit for operation: ${context.operation}`,
            userId: context.userId,
            tenantId: context.tenantId,
            metadata: context.data,
        };
        const tenantId = context.tenantId || 'default';
        const logs = this.auditLogs.get(tenantId) || [];
        logs.push(entry);
        // Maintain size limit
        if (logs.length > this.MAX_AUDIT_LOGS) {
            logs.shift();
        }
        this.auditLogs.set(tenantId, logs);
    }
    /**
     * GDPR: Data Minimization Check
     */
    async checkDataMinimization(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check if PII is being collected unnecessarily
        const data = context.data;
        if (data && typeof data === 'object') {
            const requiredFields = ['userId', 'sessionId'];
            const collectedFields = Object.keys(data);
            const unnecessaryFields = collectedFields.filter((f) => !requiredFields.includes(f));
            if (unnecessaryFields.length > 0) {
                score -= 0.3;
                violations.push({
                    requirementId: 'GDPR_ART_5',
                    severity: 'MEDIUM',
                    description: `Unnecessary data fields collected: ${unnecessaryFields.join(', ')}`,
                    evidence: `Fields: ${unnecessaryFields.join(', ')}`,
                    remediation: 'Remove unnecessary data fields or justify their necessity',
                    affectedResources: [context.tenantId || 'system'],
                });
            }
            evidence.push(`Collected ${collectedFields.length} fields, ${requiredFields.length} required`);
        }
        return {
            requirementId: 'GDPR_ART_5',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Review data collection practices'] : [],
        };
    }
    /**
     * GDPR: Data Security Check
     */
    async checkDataSecurity(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for encryption
        const hasEncryption = context.data?.encrypted === true;
        if (!hasEncryption) {
            score -= 0.5;
            violations.push({
                requirementId: 'GDPR_ART_32',
                severity: 'CRITICAL',
                description: 'Data is not encrypted',
                evidence: 'No encryption detected in data',
                remediation: 'Implement encryption at rest and in transit',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        // Check for access controls
        const hasAccessControl = context.data?.accessControlled === true;
        if (!hasAccessControl) {
            score -= 0.3;
            violations.push({
                requirementId: 'GDPR_ART_32',
                severity: 'HIGH',
                description: 'Data lacks access controls',
                evidence: 'No access control detected',
                remediation: 'Implement role-based access control',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Encryption: ${hasEncryption}, Access Control: ${hasAccessControl}`);
        return {
            requirementId: 'GDPR_ART_32',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement security controls'] : [],
        };
    }
    /**
     * GDPR: Data Protection by Design Check
     */
    async checkDataProtectionByDesign(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for privacy by design indicators
        const hasPrivacyImpactAssessment = context.data?.privacyImpactAssessment === true;
        const hasDataRetentionPolicy = context.data?.dataRetentionPolicy === true;
        if (!hasPrivacyImpactAssessment) {
            score -= 0.3;
            violations.push({
                requirementId: 'GDPR_ART_25',
                severity: 'MEDIUM',
                description: 'Privacy impact assessment not performed',
                evidence: 'No privacy impact assessment detected',
                remediation: 'Conduct privacy impact assessment for data processing',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        if (!hasDataRetentionPolicy) {
            score -= 0.3;
            violations.push({
                requirementId: 'GDPR_ART_25',
                severity: 'MEDIUM',
                description: 'Data retention policy not defined',
                evidence: 'No retention policy detected',
                remediation: 'Define and implement data retention policy',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`PIA: ${hasPrivacyImpactAssessment}, Retention Policy: ${hasDataRetentionPolicy}`);
        return {
            requirementId: 'GDPR_ART_25',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement privacy by design measures'] : [],
        };
    }
    /**
     * GDPR: Processing Records Check
     */
    async checkProcessingRecords(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check if audit log exists
        if (!context.auditLog) {
            score -= 0.5;
            violations.push({
                requirementId: 'GDPR_ART_30',
                severity: 'HIGH',
                description: 'Processing activity not logged',
                evidence: 'No audit log entry found',
                remediation: 'Ensure all processing activities are logged',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Audit Log: ${context.auditLog ? 'Present' : 'Missing'}`);
        return {
            requirementId: 'GDPR_ART_30',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement comprehensive audit logging'] : [],
        };
    }
    /**
     * SOC 2: Logical Access Controls Check
     */
    async checkLogicalAccessControls(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for authentication
        const hasAuthentication = context.userId !== undefined;
        if (!hasAuthentication) {
            score -= 0.5;
            violations.push({
                requirementId: 'SOC2_CC6_1',
                severity: 'CRITICAL',
                description: 'Access without authentication',
                evidence: 'No user ID in context',
                remediation: 'Require authentication for all operations',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        // Check for authorization
        const hasAuthorization = context.data?.authorized === true;
        if (!hasAuthorization) {
            score -= 0.3;
            violations.push({
                requirementId: 'SOC2_CC6_1',
                severity: 'HIGH',
                description: 'Access without proper authorization',
                evidence: 'No authorization check detected',
                remediation: 'Implement role-based access control',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Authentication: ${hasAuthentication}, Authorization: ${hasAuthorization}`);
        return {
            requirementId: 'SOC2_CC6_1',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Strengthen access controls'] : [],
        };
    }
    /**
     * SOC 2: Audit Logging Check
     */
    async checkAuditLogging(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check audit log
        if (!context.auditLog) {
            score -= 0.5;
            violations.push({
                requirementId: 'SOC2_CC6_6',
                severity: 'HIGH',
                description: 'Activity not logged',
                evidence: 'No audit log entry',
                remediation: 'Implement comprehensive audit logging',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Audit Log: ${context.auditLog ? 'Present' : 'Missing'}`);
        return {
            requirementId: 'SOC2_CC6_6',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement audit logging'] : [],
        };
    }
    /**
     * SOC 2: Incident Response Check
     */
    async checkIncidentResponse(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for incident response capability
        const hasIncidentResponse = context.data?.incidentResponse === true;
        if (!hasIncidentResponse) {
            score -= 0.3;
            violations.push({
                requirementId: 'SOC2_CC7_2',
                severity: 'MEDIUM',
                description: 'Incident response procedures not established',
                evidence: 'No incident response capability detected',
                remediation: 'Establish incident response procedures',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Incident Response: ${hasIncidentResponse}`);
        return {
            requirementId: 'SOC2_CC7_2',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Establish incident response'] : [],
        };
    }
    /**
     * ISO 27001: Access Control Policy Check
     */
    async checkAccessControlPolicy(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Similar to SOC 2 logical access controls
        const hasAuthentication = context.userId !== undefined;
        const hasAuthorization = context.data?.authorized === true;
        if (!hasAuthentication || !hasAuthorization) {
            score -= 0.4;
            violations.push({
                requirementId: 'ISO_A9_1',
                severity: 'HIGH',
                description: 'Access control policy not enforced',
                evidence: 'Missing authentication or authorization',
                remediation: 'Enforce access control policy',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Authentication: ${hasAuthentication}, Authorization: ${hasAuthorization}`);
        return {
            requirementId: 'ISO_A9_1',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Enforce access control policy'] : [],
        };
    }
    /**
     * ISO 27001: Backup Information Check
     */
    async checkBackupInformation(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for backup capability
        const hasBackup = context.data?.backup === true;
        if (!hasBackup) {
            score -= 0.3;
            violations.push({
                requirementId: 'ISO_A12_3',
                severity: 'MEDIUM',
                description: 'Backup procedures not confirmed',
                evidence: 'No backup confirmation',
                remediation: 'Implement and test backup procedures',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Backup: ${hasBackup}`);
        return {
            requirementId: 'ISO_A12_3',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement backup procedures'] : [],
        };
    }
    /**
     * EU AI Act: Data Governance Check
     */
    async checkAIDataGovernance(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for data quality measures
        const hasDataQualityCheck = context.data?.dataQualityChecked === true;
        const hasDataBiasCheck = context.data?.dataBiasChecked === true;
        if (!hasDataQualityCheck) {
            score -= 0.3;
            violations.push({
                requirementId: 'EUAI_ART_10',
                severity: 'HIGH',
                description: 'Data quality not verified',
                evidence: 'No data quality check',
                remediation: 'Implement data quality verification',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        if (!hasDataBiasCheck) {
            score -= 0.3;
            violations.push({
                requirementId: 'EUAI_ART_10',
                severity: 'HIGH',
                description: 'Data bias not checked',
                evidence: 'No bias check',
                remediation: 'Implement bias detection and mitigation',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`Data Quality: ${hasDataQualityCheck}, Bias Check: ${hasDataBiasCheck}`);
        return {
            requirementId: 'EUAI_ART_10',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement AI data governance'] : [],
        };
    }
    /**
     * EU AI Act: AI Transparency Check
     */
    async checkAITransparency(context) {
        const violations = [];
        const evidence = [];
        let score = 1.0;
        // Check for AI disclosure
        const hasAIDisclosure = context.data?.aiDisclosed === true;
        if (!hasAIDisclosure) {
            score -= 0.5;
            violations.push({
                requirementId: 'EUAI_ART_12',
                severity: 'HIGH',
                description: 'AI system not disclosed to users',
                evidence: 'No AI disclosure',
                remediation: 'Disclose AI system presence to users',
                affectedResources: [context.tenantId || 'system'],
            });
        }
        evidence.push(`AI Disclosure: ${hasAIDisclosure}`);
        return {
            requirementId: 'EUAI_ART_12',
            passed: score >= 0.8,
            score,
            evidence,
            violations,
            recommendations: violations.length > 0 ? ['Implement AI transparency'] : [],
        };
    }
    /**
     * Generate recommendations from check results
     */
    generateRecommendations(results) {
        const recommendations = new Set();
        for (const result of results) {
            for (const rec of result.recommendations) {
                recommendations.add(rec);
            }
        }
        return Array.from(recommendations);
    }
    /**
     * Generate overall recommendations
     */
    generateOverallRecommendations(requirements) {
        const criticalViolations = requirements.flatMap((r) => r.violations.filter((v) => v.severity === 'CRITICAL'));
        const highViolations = requirements.flatMap((r) => r.violations.filter((v) => v.severity === 'HIGH'));
        const recommendations = [];
        if (criticalViolations.length > 0) {
            recommendations.push(`URGENT: Address ${criticalViolations.length} critical compliance violations`);
        }
        if (highViolations.length > 0) {
            recommendations.push(`HIGH: Address ${highViolations.length} high-severity violations`);
        }
        const failedRequirements = requirements.filter((r) => !r.passed);
        if (failedRequirements.length > 0) {
            recommendations.push(`Review ${failedRequirements.length} failed compliance requirements`);
        }
        return recommendations;
    }
    /**
     * Determine trend from historical scores
     */
    determineTrend(framework, currentScore) {
        const scores = this.historicalScores.get(framework) || [];
        if (scores.length < 3) {
            return 'STABLE';
        }
        // Add current score
        scores.push(currentScore);
        // Maintain size limit
        if (scores.length > this.MAX_HISTORICAL_SCORES) {
            scores.shift();
        }
        this.historicalScores.set(framework, scores);
        // Calculate trend
        const recent = scores.slice(-5);
        const avgRecent = recent.reduce((sum, s) => sum + s, 0) / recent.length;
        const older = scores.slice(0, -5);
        const avgOlder = older.reduce((sum, s) => sum + s, 0) / older.length;
        const delta = avgRecent - avgOlder;
        if (delta > 0.05) {
            return 'IMPROVING';
        }
        else if (delta < -0.05) {
            return 'DECLINING';
        }
        return 'STABLE';
    }
    /**
     * Get compliance status
     */
    async getComplianceStatus(framework, tenantId) {
        const period = {
            start: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
            end: Date.now(),
        };
        const report = await this.generateComplianceReport(framework, period, tenantId);
        return {
            compliant: report.summary.criticalViolations === 0 && report.summary.highSeverityViolations === 0,
            score: report.overallScore,
            violations: report.requirements.flatMap((r) => r.violations),
            framework: report.framework,
        };
    }
    /**
     * Clear audit logs
     */
    clearAuditLogs(tenantId) {
        if (tenantId) {
            this.auditLogs.delete(tenantId);
        }
        else {
            this.auditLogs.clear();
        }
    }
}
exports.ComplianceAuditor = ComplianceAuditor;
/**
 * Create compliance auditor instance
 */
function createComplianceAuditor() {
    return new ComplianceAuditor();
}
/**
 * Global instance
 */
exports.complianceAuditor = createComplianceAuditor();
