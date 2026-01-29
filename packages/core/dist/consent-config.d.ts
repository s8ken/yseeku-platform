/**
 * Consent & Escalation Configuration
 *
 * Enterprise-customizable configuration for consent architecture and human escalation.
 * Default configuration is EU GDPR/AI Act compliant out of the box.
 *
 * Enterprises can customize:
 * - Consent model (binary, graduated, hybrid)
 * - Escalation channels (human handoff, email, phone, callback)
 * - Data retention policies
 * - Withdrawal handling behavior
 */
/**
 * Consent model types
 * - BINARY: User either consents or doesn't (strict interpretation)
 * - GRADUATED: Consent can be partial (e.g., consent to chat but not data storage)
 * - HYBRID: Binary for critical functions, graduated for optional features
 */
export type ConsentModel = 'BINARY' | 'GRADUATED' | 'HYBRID';
/**
 * Escalation channel types
 */
export type EscalationChannel = 'LIVE_HANDOFF' | 'CALLBACK_REQUEST' | 'EMAIL_SUPPORT' | 'PHONE_SUPPORT' | 'TICKET_SYSTEM' | 'CHATBOT_EXIT';
/**
 * Data request handling modes
 */
export type DataRequestMode = 'IMMEDIATE' | 'VERIFIED' | 'MANUAL_REVIEW' | 'EXTERNAL_SYSTEM';
/**
 * Consent scope categories
 */
export interface ConsentScopes {
    aiInteraction: boolean;
    dataStorage: boolean;
    dataTraining: boolean;
    personalization: boolean;
    analytics: boolean;
    thirdPartySharing: boolean;
}
/**
 * Escalation channel configuration
 */
export interface EscalationChannelConfig {
    type: EscalationChannel;
    enabled: boolean;
    priority: number;
    endpoint?: string;
    email?: string;
    phone?: string;
    queueId?: string;
    availableHours?: {
        start: string;
        end: string;
        timezone: string;
        days: number[];
    };
    fallbackChannel?: EscalationChannel;
    expectedResponseTime?: string;
    label: string;
    description?: string;
    icon?: string;
}
/**
 * Data request configuration
 */
export interface DataRequestConfig {
    export: {
        enabled: boolean;
        mode: DataRequestMode;
        format: 'JSON' | 'CSV' | 'PDF';
        maxWaitTime: string;
        includeMetadata: boolean;
        verificationRequired: boolean;
    };
    deletion: {
        enabled: boolean;
        mode: DataRequestMode;
        confirmationRequired: boolean;
        gracePeriod: string;
        notifyOnCompletion: boolean;
    };
    restriction: {
        enabled: boolean;
        mode: DataRequestMode;
    };
    portability: {
        enabled: boolean;
        mode: DataRequestMode;
        supportedFormats: string[];
    };
}
/**
 * Withdrawal behavior configuration
 */
export interface WithdrawalBehavior {
    humanEscalation: {
        autoTransfer: boolean;
        confirmFirst: boolean;
        preserveContext: boolean;
    };
    explicitRevocation: {
        immediateEffect: boolean;
        requireConfirmation: boolean;
        offerAlternatives: boolean;
    };
    dataRequest: {
        autoAcknowledge: boolean;
        requireVerification: boolean;
        routeToSystem: boolean;
    };
    optOut: {
        sessionOnly: boolean;
        accountWide: boolean;
        requireConfirmation: boolean;
    };
    frustrationExit: {
        offerHuman: boolean;
        offerAlternatives: boolean;
        allowSilentExit: boolean;
    };
}
/**
 * Full consent configuration
 */
export interface ConsentConfiguration {
    version: string;
    model: ConsentModel;
    defaultScopes: ConsentScopes;
    requiredScopes: (keyof ConsentScopes)[];
    consentExpiryDays: number | null;
    escalationChannels: EscalationChannelConfig[];
    dataRequests: DataRequestConfig;
    withdrawalBehavior: WithdrawalBehavior;
    compliance: {
        gdprCompliant: boolean;
        aiActCompliant: boolean;
        ccpaCompliant: boolean;
        customRegulations?: string[];
    };
    ui: {
        consentBannerStyle: 'MINIMAL' | 'DETAILED' | 'LAYERED';
        showDataUsageExplanations: boolean;
        showWithdrawalOptions: boolean;
        escalationButtonLabel: string;
        escalationButtonPosition: 'HEADER' | 'CHAT' | 'BOTH';
    };
}
/**
 * Default EU-compliant configuration
 * This is the out-of-the-box configuration that meets GDPR and AI Act requirements
 */
export declare const DEFAULT_EU_CONFIG: ConsentConfiguration;
/**
 * Minimal configuration for enterprises that want less friction
 * Still GDPR compliant but with streamlined UX
 */
export declare const STREAMLINED_CONFIG: ConsentConfiguration;
/**
 * Strict configuration for high-compliance environments (healthcare, finance)
 */
export declare const STRICT_CONFIG: ConsentConfiguration;
/**
 * US-focused configuration (CCPA primary, GDPR secondary)
 */
export declare const US_CONFIG: ConsentConfiguration;
/**
 * Get configuration by name
 */
export declare function getConsentConfig(name?: 'default' | 'streamlined' | 'strict' | 'us'): ConsentConfiguration;
/**
 * Validate a custom configuration for compliance
 */
export declare function validateConsentConfig(config: ConsentConfiguration): {
    valid: boolean;
    warnings: string[];
    errors: string[];
};
/**
 * Merge custom config with defaults
 */
export declare function mergeWithDefaults(customConfig: Partial<ConsentConfiguration>, base?: ConsentConfiguration): ConsentConfiguration;
export default DEFAULT_EU_CONFIG;
