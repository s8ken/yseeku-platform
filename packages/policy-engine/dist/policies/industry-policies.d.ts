/**
 * Industry-specific policies for SONATE Platform
 */
import { IndustryPolicy, IndustryType } from '../types';
/**
 * Industry Policies Manager
 */
export declare class IndustryPolicies {
    private policies;
    constructor();
    /**
     * Get base policy
     */
    getBasePolicy(policyId: string): Promise<IndustryPolicy>;
    /**
     * Get industry-specific policy
     */
    getIndustryPolicy(industry: IndustryType): Promise<IndustryPolicy>;
    /**
     * Get supported industries
     */
    getSupportedIndustries(): IndustryType[];
    /**
     * Get industry templates
     */
    getIndustryTemplates(industry: IndustryType): Promise<IndustryPolicy[]>;
    /**
     * Initialize default policies
     */
    private initializePolicies;
    /**
     * Create base standard policy
     */
    private createBaseStandardPolicy;
    /**
     * Create healthcare policy
     */
    private createHealthcarePolicy;
    /**
     * Create finance policy
     */
    private createFinancePolicy;
    /**
     * Create technology policy
     */
    private createTechnologyPolicy;
    /**
     * Create conservative policy variant
     */
    private getConservativePolicy;
    /**
     * Create aggressive policy variant
     */
    private getAggressivePolicy;
    /**
     * Create compliance framework
     */
    private createComplianceFramework;
    /**
     * Create standard thresholds
     */
    private createStandardThresholds;
    /**
     * Create standard rules
     */
    private createStandardRules;
    /**
     * Create healthcare-specific rules
     */
    private createHealthcareRules;
    /**
     * Create finance-specific rules
     */
    private createFinanceRules;
    /**
     * Create technology-specific rules
     */
    private createTechnologyRules;
    private createBaseHighSecurityPolicy;
    private createBaseLowLatencyPolicy;
    private createGovernmentPolicy;
    private createEducationPolicy;
    private createManufacturingPolicy;
    private createRetailPolicy;
    private createEnergyPolicy;
    private createTransportationPolicy;
    private createLegalPolicy;
}
//# sourceMappingURL=industry-policies.d.ts.map