"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.US_CONFIG = exports.STRICT_CONFIG = exports.STREAMLINED_CONFIG = exports.DEFAULT_EU_CONFIG = void 0;
exports.getConsentConfig = getConsentConfig;
exports.validateConsentConfig = validateConsentConfig;
exports.mergeWithDefaults = mergeWithDefaults;
/**
 * Default EU-compliant configuration
 * This is the out-of-the-box configuration that meets GDPR and AI Act requirements
 */
exports.DEFAULT_EU_CONFIG = {
    version: '1.0.0',
    model: 'HYBRID', // Binary for critical, graduated for optional
    defaultScopes: {
        aiInteraction: false, // Must explicitly consent
        dataStorage: false, // Must explicitly consent
        dataTraining: false, // Must explicitly consent
        personalization: false, // Must explicitly consent
        analytics: false, // Must explicitly consent
        thirdPartySharing: false, // Must explicitly consent
    },
    requiredScopes: ['aiInteraction'], // Only AI interaction is required to use chat
    consentExpiryDays: 365, // Re-consent annually
    escalationChannels: [
        {
            type: 'LIVE_HANDOFF',
            enabled: true,
            priority: 1,
            label: 'Connect to Human Agent',
            description: 'Speak with a real person now',
            icon: 'phone',
            expectedResponseTime: '2 minutes',
            availableHours: {
                start: '09:00',
                end: '18:00',
                timezone: 'Europe/London',
                days: [1, 2, 3, 4, 5], // Mon-Fri
            },
            fallbackChannel: 'CALLBACK_REQUEST',
        },
        {
            type: 'CALLBACK_REQUEST',
            enabled: true,
            priority: 2,
            label: 'Request Callback',
            description: 'We\'ll call you back within 24 hours',
            icon: 'phone-callback',
            expectedResponseTime: '24 hours',
        },
        {
            type: 'EMAIL_SUPPORT',
            enabled: true,
            priority: 3,
            email: 'support@example.com',
            label: 'Email Support',
            description: 'Response within 48 hours',
            icon: 'mail',
            expectedResponseTime: '48 hours',
        },
    ],
    dataRequests: {
        export: {
            enabled: true,
            mode: 'VERIFIED',
            format: 'JSON',
            maxWaitTime: '30 days', // GDPR allows up to 30 days
            includeMetadata: true,
            verificationRequired: true,
        },
        deletion: {
            enabled: true,
            mode: 'VERIFIED',
            confirmationRequired: true,
            gracePeriod: '30 days',
            notifyOnCompletion: true,
        },
        restriction: {
            enabled: true,
            mode: 'IMMEDIATE',
        },
        portability: {
            enabled: true,
            mode: 'VERIFIED',
            supportedFormats: ['JSON', 'CSV'],
        },
    },
    withdrawalBehavior: {
        humanEscalation: {
            autoTransfer: true,
            confirmFirst: false, // Don't add friction
            preserveContext: true,
        },
        explicitRevocation: {
            immediateEffect: true,
            requireConfirmation: true, // Confirm they really want to revoke
            offerAlternatives: true,
        },
        dataRequest: {
            autoAcknowledge: true,
            requireVerification: true,
            routeToSystem: true,
        },
        optOut: {
            sessionOnly: true,
            accountWide: true,
            requireConfirmation: true,
        },
        frustrationExit: {
            offerHuman: true,
            offerAlternatives: true,
            allowSilentExit: true,
        },
    },
    compliance: {
        gdprCompliant: true,
        aiActCompliant: true,
        ccpaCompliant: true, // Also CCPA compliant
    },
    ui: {
        consentBannerStyle: 'LAYERED', // GDPR best practice
        showDataUsageExplanations: true,
        showWithdrawalOptions: true,
        escalationButtonLabel: 'Speak to a Human',
        escalationButtonPosition: 'BOTH',
    },
};
/**
 * Minimal configuration for enterprises that want less friction
 * Still GDPR compliant but with streamlined UX
 */
exports.STREAMLINED_CONFIG = {
    ...exports.DEFAULT_EU_CONFIG,
    version: '1.0.0-streamlined',
    model: 'GRADUATED',
    ui: {
        ...exports.DEFAULT_EU_CONFIG.ui,
        consentBannerStyle: 'MINIMAL',
    },
    withdrawalBehavior: {
        ...exports.DEFAULT_EU_CONFIG.withdrawalBehavior,
        explicitRevocation: {
            ...exports.DEFAULT_EU_CONFIG.withdrawalBehavior.explicitRevocation,
            requireConfirmation: false, // No confirmation, respect immediately
        },
    },
};
/**
 * Strict configuration for high-compliance environments (healthcare, finance)
 */
exports.STRICT_CONFIG = {
    ...exports.DEFAULT_EU_CONFIG,
    version: '1.0.0-strict',
    model: 'BINARY', // Strict binary consent
    consentExpiryDays: 90, // Re-consent quarterly
    requiredScopes: ['aiInteraction', 'dataStorage'], // Both required
    dataRequests: {
        ...exports.DEFAULT_EU_CONFIG.dataRequests,
        export: {
            ...exports.DEFAULT_EU_CONFIG.dataRequests.export,
            mode: 'MANUAL_REVIEW', // Human reviews all data requests
        },
        deletion: {
            ...exports.DEFAULT_EU_CONFIG.dataRequests.deletion,
            mode: 'MANUAL_REVIEW',
            gracePeriod: '7 days', // Shorter grace period
        },
    },
    compliance: {
        gdprCompliant: true,
        aiActCompliant: true,
        ccpaCompliant: true,
        customRegulations: ['HIPAA', 'PCI-DSS'],
    },
};
/**
 * US-focused configuration (CCPA primary, GDPR secondary)
 */
exports.US_CONFIG = {
    ...exports.DEFAULT_EU_CONFIG,
    version: '1.0.0-us',
    model: 'GRADUATED',
    consentExpiryDays: null, // No expiry
    defaultScopes: {
        aiInteraction: true, // Opt-out model
        dataStorage: true,
        dataTraining: false, // Still require opt-in
        personalization: true,
        analytics: true,
        thirdPartySharing: false, // Still require opt-in
    },
    compliance: {
        gdprCompliant: false, // Not fully GDPR compliant (opt-out model)
        aiActCompliant: true,
        ccpaCompliant: true,
    },
    ui: {
        ...exports.DEFAULT_EU_CONFIG.ui,
        consentBannerStyle: 'MINIMAL',
    },
};
/**
 * Get configuration by name
 */
function getConsentConfig(name = 'default') {
    switch (name) {
        case 'streamlined':
            return exports.STREAMLINED_CONFIG;
        case 'strict':
            return exports.STRICT_CONFIG;
        case 'us':
            return exports.US_CONFIG;
        default:
            return exports.DEFAULT_EU_CONFIG;
    }
}
/**
 * Validate a custom configuration for compliance
 */
function validateConsentConfig(config) {
    const warnings = [];
    const errors = [];
    // GDPR checks
    if (config.compliance.gdprCompliant) {
        // Must have data export capability
        if (!config.dataRequests.export.enabled) {
            errors.push('GDPR requires data export capability (right to access)');
        }
        // Must have deletion capability
        if (!config.dataRequests.deletion.enabled) {
            errors.push('GDPR requires data deletion capability (right to erasure)');
        }
        // Must have at least one escalation channel
        if (config.escalationChannels.filter(c => c.enabled).length === 0) {
            errors.push('GDPR requires human oversight capability');
        }
        // Opt-in consent model recommended
        if (config.defaultScopes.dataStorage || config.defaultScopes.analytics) {
            warnings.push('GDPR recommends opt-in consent model (default scopes should be false)');
        }
        // Consent expiry recommended
        if (config.consentExpiryDays === null) {
            warnings.push('GDPR recommends periodic re-consent (consentExpiryDays should be set)');
        }
    }
    // AI Act checks
    if (config.compliance.aiActCompliant) {
        // Must have human escalation
        const hasHumanChannel = config.escalationChannels.some(c => c.enabled && (c.type === 'LIVE_HANDOFF' || c.type === 'CALLBACK_REQUEST'));
        if (!hasHumanChannel) {
            errors.push('AI Act requires meaningful human oversight (live handoff or callback required)');
        }
        // Must preserve context on escalation
        if (!config.withdrawalBehavior.humanEscalation.preserveContext) {
            warnings.push('AI Act recommends preserving context on human escalation for continuity');
        }
    }
    return {
        valid: errors.length === 0,
        warnings,
        errors,
    };
}
/**
 * Merge custom config with defaults
 */
function mergeWithDefaults(customConfig, base = exports.DEFAULT_EU_CONFIG) {
    return {
        ...base,
        ...customConfig,
        defaultScopes: { ...base.defaultScopes, ...customConfig.defaultScopes },
        dataRequests: {
            export: { ...base.dataRequests.export, ...customConfig.dataRequests?.export },
            deletion: { ...base.dataRequests.deletion, ...customConfig.dataRequests?.deletion },
            restriction: { ...base.dataRequests.restriction, ...customConfig.dataRequests?.restriction },
            portability: { ...base.dataRequests.portability, ...customConfig.dataRequests?.portability },
        },
        withdrawalBehavior: {
            humanEscalation: { ...base.withdrawalBehavior.humanEscalation, ...customConfig.withdrawalBehavior?.humanEscalation },
            explicitRevocation: { ...base.withdrawalBehavior.explicitRevocation, ...customConfig.withdrawalBehavior?.explicitRevocation },
            dataRequest: { ...base.withdrawalBehavior.dataRequest, ...customConfig.withdrawalBehavior?.dataRequest },
            optOut: { ...base.withdrawalBehavior.optOut, ...customConfig.withdrawalBehavior?.optOut },
            frustrationExit: { ...base.withdrawalBehavior.frustrationExit, ...customConfig.withdrawalBehavior?.frustrationExit },
        },
        compliance: { ...base.compliance, ...customConfig.compliance },
        ui: { ...base.ui, ...customConfig.ui },
        escalationChannels: customConfig.escalationChannels || base.escalationChannels,
    };
}
exports.default = exports.DEFAULT_EU_CONFIG;
