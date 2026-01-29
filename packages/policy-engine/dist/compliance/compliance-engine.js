"use strict";
/**
 * Compliance Engine for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceEngine = void 0;
/**
 * Compliance Engine class
 */
class ComplianceEngine {
    /**
     * Assess compliance status for a policy
     */
    async assessCompliance(policy, trustScore, violations) {
        const frameworkStatuses = await this.assessFrameworks(policy, trustScore, violations);
        const overall = this.calculateOverallCompliance(frameworkStatuses);
        return {
            overall,
            frameworks: frameworkStatuses,
            lastAudit: Date.now(),
            nextAudit: this.calculateNextAuditDate(policy),
            openIssues: violations.filter(v => v.severity !== 'info').length,
            criticalIssues: violations.filter(v => v.severity === 'critical').length
        };
    }
    /**
     * Validate policy compliance
     */
    async validatePolicyCompliance(policy) {
        try {
            // Validate compliance frameworks
            for (const framework of policy.complianceFrameworks) {
                this.validateFramework(framework);
            }
            // Validate thresholds
            this.validateThresholds(policy.thresholds);
            // Validate rules
            this.validateRules(policy.customRules);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Generate compliance report
     */
    async generateComplianceReport(policy, trustScore, violations) {
        const complianceStatus = await this.assessCompliance(policy, trustScore, violations);
        return {
            policyId: policy.id,
            policyName: policy.name,
            industry: policy.industry,
            reportDate: Date.now(),
            complianceStatus,
            violations: violations,
            recommendations: this.generateComplianceRecommendations(complianceStatus, violations),
            evidence: this.generateEvidenceList(policy),
            auditTrail: this.generateAuditTrail(policy, trustScore, violations)
        };
    }
    /**
     * Assess compliance for each framework
     */
    async assessFrameworks(policy, trustScore, violations) {
        const frameworkStatuses = {};
        for (const framework of policy.complianceFrameworks) {
            frameworkStatuses[framework.id] = await this.assessFrameworkCompliance(framework, trustScore, violations);
        }
        return frameworkStatuses;
    }
    /**
     * Assess compliance for a single framework
     */
    async assessFrameworkCompliance(framework, trustScore, violations) {
        let complianceScore = 100;
        // Check principle mappings
        for (const [principle, requirements] of Object.entries(framework.principleMappings)) {
            const principleScore = trustScore.principles[principle];
            for (const requirement of requirements) {
                if (requirement.mandatory && principleScore < 7.0) {
                    complianceScore -= 20; // Major penalty for mandatory requirements
                }
                else if (!requirement.mandatory && principleScore < 5.0) {
                    complianceScore -= 10; // Minor penalty for optional requirements
                }
            }
        }
        // Check violations
        for (const violation of violations) {
            if (this.isViolationRelevantToFramework(violation, framework)) {
                complianceScore -= this.getViolationPenalty(violation.severity);
            }
        }
        // Convert score to compliance level
        if (complianceScore >= 90)
            return 'compliant';
        if (complianceScore >= 70)
            return 'partial';
        if (complianceScore >= 50)
            return 'non_compliant';
        return 'unknown';
    }
    /**
     * Check if violation is relevant to framework
     */
    isViolationRelevantToFramework(violation, framework) {
        const principleRequirements = framework.principleMappings[violation.principle];
        return principleRequirements !== undefined && principleRequirements.length > 0;
    }
    /**
     * Get penalty for violation severity
     */
    getViolationPenalty(severity) {
        switch (severity) {
            case 'critical': return 25;
            case 'error': return 15;
            case 'warning': return 10;
            case 'info': return 5;
            default: return 0;
        }
    }
    /**
     * Calculate overall compliance level
     */
    calculateOverallCompliance(frameworkStatuses) {
        const levels = Object.values(frameworkStatuses);
        if (levels.every(level => level === 'compliant')) {
            return 'compliant';
        }
        else if (levels.some(level => level === 'non_compliant')) {
            return 'non_compliant';
        }
        else if (levels.some(level => level === 'partial')) {
            return 'partial';
        }
        return 'unknown';
    }
    /**
     * Calculate next audit date
     */
    calculateNextAuditDate(policy) {
        // Use the most frequent audit requirement
        const auditFrequencies = policy.complianceFrameworks.flatMap(f => f.auditRequirements.map(r => r.frequency));
        const frequencyMap = {
            'real_time': 1,
            'hourly': 24,
            'daily': 24 * 7,
            'weekly': 24 * 7 * 4,
            'monthly': 24 * 7 * 30,
            'quarterly': 24 * 7 * 90,
            'annually': 24 * 7 * 365
        };
        const maxFrequency = Math.max(...auditFrequencies.map(f => frequencyMap[f] || 30));
        return Date.now() + (maxFrequency * 60 * 60 * 1000);
    }
    /**
     * Validate compliance framework
     */
    validateFramework(framework) {
        if (!framework.id || !framework.name || !framework.version) {
            throw new Error('Framework must have id, name, and version');
        }
        if (!framework.principleMappings || Object.keys(framework.principleMappings).length === 0) {
            throw new Error('Framework must have principle mappings');
        }
        // Validate principle mappings
        for (const [principle, requirements] of Object.entries(framework.principleMappings)) {
            if (!Array.isArray(requirements) || requirements.length === 0) {
                throw new Error(`Principle ${principle} must have requirements`);
            }
            for (const requirement of requirements) {
                if (!requirement.id || !requirement.description) {
                    throw new Error(`Requirement must have id and description`);
                }
            }
        }
    }
    /**
     * Validate thresholds
     */
    validateThresholds(thresholds) {
        if (!thresholds.trustScore) {
            throw new Error('Trust score thresholds required');
        }
        const { minimum, warning, critical } = thresholds.trustScore;
        if (minimum > warning || warning > critical) {
            throw new Error('Trust score thresholds must be: minimum <= warning <= critical');
        }
    }
    /**
     * Validate rules
     */
    validateRules(rules) {
        for (const rule of rules) {
            if (!rule.id || !rule.name || !rule.type) {
                throw new Error('Rule must have id, name, and type');
            }
            if (rule.condition && !rule.condition.operator) {
                throw new Error('Rule condition must have operator');
            }
            if (rule.action && !rule.action.type) {
                throw new Error('Rule action must have type');
            }
        }
    }
    /**
     * Generate compliance recommendations
     */
    generateComplianceRecommendations(complianceStatus, violations) {
        const recommendations = [];
        // Generate recommendations based on compliance status
        if (complianceStatus.overall === 'non_compliant') {
            recommendations.push({
                id: 'immediate-compliance',
                title: 'Immediate Compliance Action Required',
                description: 'System is non-compliant. Immediate action required to address critical issues.',
                priority: 'critical',
                actions: [
                    'Review and address all critical violations',
                    'Implement missing compliance controls',
                    'Schedule emergency compliance audit'
                ],
                dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                framework: 'all'
            });
        }
        if (complianceStatus.overall === 'partial') {
            recommendations.push({
                id: 'compliance-improvement',
                title: 'Compliance Improvement Plan',
                description: 'System is partially compliant. Implement improvements to achieve full compliance.',
                priority: 'high',
                actions: [
                    'Address medium and high severity violations',
                    'Enhance monitoring and reporting',
                    'Schedule follow-up compliance review'
                ],
                dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
                framework: 'all'
            });
        }
        // Generate framework-specific recommendations
        Object.entries(complianceStatus.frameworks).forEach(([frameworkId, level]) => {
            if (level !== 'compliant') {
                recommendations.push({
                    id: `framework-${frameworkId}`,
                    title: `${frameworkId} Compliance Issues`,
                    description: `Issues found in ${frameworkId} compliance framework.`,
                    priority: level === 'non_compliant' ? 'critical' : 'medium',
                    actions: [
                        'Review framework-specific requirements',
                        'Implement missing controls',
                        'Update documentation and procedures'
                    ],
                    dueDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days
                    framework: frameworkId
                });
            }
        });
        return recommendations;
    }
    /**
     * Generate evidence list
     */
    generateEvidenceList(policy) {
        const evidence = [];
        // Add evidence requirements from all frameworks
        policy.complianceFrameworks.forEach(framework => {
            framework.auditRequirements.forEach(requirement => {
                requirement.evidenceRequired.forEach(evidenceReq => {
                    evidence.push({
                        type: evidenceReq.type,
                        description: evidenceReq.description,
                        retention: evidenceReq.retention,
                        format: evidenceReq.format,
                        framework: framework.id,
                        requirement: requirement.id
                    });
                });
            });
        });
        return evidence;
    }
    /**
     * Generate audit trail
     */
    generateAuditTrail(policy, trustScore, violations) {
        const trail = [];
        // Add policy evaluation entry
        trail.push({
            timestamp: Date.now(),
            action: 'policy_evaluation',
            details: `Policy ${policy.id} evaluated with trust score ${trustScore.overall}`,
            actor: 'system',
            evidence: {
                trustScore: trustScore.overall,
                principleScores: trustScore.principles,
                violations: violations.length
            }
        });
        // Add violation entries
        violations.forEach(violation => {
            trail.push({
                timestamp: violation.timestamp,
                action: 'violation_detected',
                details: violation.description,
                actor: 'system',
                evidence: {
                    ruleId: violation.ruleId,
                    principle: violation.principle,
                    severity: violation.severity,
                    actualValue: violation.actualValue,
                    expectedValue: violation.expectedValue
                }
            });
        });
        return trail;
    }
}
exports.ComplianceEngine = ComplianceEngine;
