"use strict";
/**
 * @sonate/core - Core Trust Protocol Implementation
 *
 * Implements the SONATE Trust Framework as specified at:
 * https://gammatria.com/schemas/trust-receipt
 *
 * This package provides the foundational trust infrastructure
 * for all SONATE platform modules.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureAuthService = exports.runSecurityAudit = exports.SecurityAuditor = exports.TRUST_PRINCIPLES = exports.LogLevel = exports.apiLogger = exports.performanceLogger = exports.securityLogger = exports.createLogger = exports.log = exports.logger = exports.generateKeyPair = exports.verifySignature = exports.signPayload = exports.genesisHash = exports.hashChain = exports.mergeWithDefaults = exports.validateConsentConfig = exports.getConsentConfig = exports.US_CONFIG = exports.STRICT_CONFIG = exports.STREAMLINED_CONFIG = exports.DEFAULT_EU_CONFIG = exports.createDefaultContext = exports.PrincipleEvaluator = exports.SonateScorer = exports.TrustReceipt = exports.TrustProtocol = void 0;
// === TRUST LAYER ===
var trust_protocol_1 = require("./trust/trust-protocol");
Object.defineProperty(exports, "TrustProtocol", { enumerable: true, get: function () { return trust_protocol_1.TrustProtocol; } });
var trust_receipt_1 = require("./receipts/trust-receipt");
Object.defineProperty(exports, "TrustReceipt", { enumerable: true, get: function () { return trust_receipt_1.TrustReceipt; } });
// === PRINCIPLES LAYER ===
var sonate_scorer_1 = require("./principles/sonate-scorer");
Object.defineProperty(exports, "SonateScorer", { enumerable: true, get: function () { return sonate_scorer_1.SonateScorer; } });
var principle_evaluator_1 = require("./principles/principle-evaluator");
Object.defineProperty(exports, "PrincipleEvaluator", { enumerable: true, get: function () { return principle_evaluator_1.PrincipleEvaluator; } });
Object.defineProperty(exports, "createDefaultContext", { enumerable: true, get: function () { return principle_evaluator_1.createDefaultContext; } });
// === CONFIGURATION LAYER ===
var consent_config_1 = require("./config/consent-config");
Object.defineProperty(exports, "DEFAULT_EU_CONFIG", { enumerable: true, get: function () { return consent_config_1.DEFAULT_EU_CONFIG; } });
Object.defineProperty(exports, "STREAMLINED_CONFIG", { enumerable: true, get: function () { return consent_config_1.STREAMLINED_CONFIG; } });
Object.defineProperty(exports, "STRICT_CONFIG", { enumerable: true, get: function () { return consent_config_1.STRICT_CONFIG; } });
Object.defineProperty(exports, "US_CONFIG", { enumerable: true, get: function () { return consent_config_1.US_CONFIG; } });
Object.defineProperty(exports, "getConsentConfig", { enumerable: true, get: function () { return consent_config_1.getConsentConfig; } });
Object.defineProperty(exports, "validateConsentConfig", { enumerable: true, get: function () { return consent_config_1.validateConsentConfig; } });
Object.defineProperty(exports, "mergeWithDefaults", { enumerable: true, get: function () { return consent_config_1.mergeWithDefaults; } });
// === ERROR LAYER ===
__exportStar(require("./utils/errors"), exports);
// === UTILITIES LAYER ===
var hash_chain_1 = require("./utils/hash-chain");
Object.defineProperty(exports, "hashChain", { enumerable: true, get: function () { return hash_chain_1.hashChain; } });
Object.defineProperty(exports, "genesisHash", { enumerable: true, get: function () { return hash_chain_1.genesisHash; } });
var signatures_1 = require("./utils/signatures");
Object.defineProperty(exports, "signPayload", { enumerable: true, get: function () { return signatures_1.signPayload; } });
Object.defineProperty(exports, "verifySignature", { enumerable: true, get: function () { return signatures_1.verifySignature; } });
Object.defineProperty(exports, "generateKeyPair", { enumerable: true, get: function () { return signatures_1.generateKeyPair; } });
__exportStar(require("./utils/crypto-advanced"), exports);
__exportStar(require("./utils/robust-fetch"), exports);
__exportStar(require("./utils/canonicalize"), exports);
// === LOGGING INFRASTRUCTURE ===
var logger_1 = require("./utils/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return logger_1.log; } });
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
Object.defineProperty(exports, "securityLogger", { enumerable: true, get: function () { return logger_1.securityLogger; } });
Object.defineProperty(exports, "performanceLogger", { enumerable: true, get: function () { return logger_1.performanceLogger; } });
Object.defineProperty(exports, "apiLogger", { enumerable: true, get: function () { return logger_1.apiLogger; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_1.LogLevel; } });
// Monitoring infrastructure (Phase 4)
__exportStar(require("./monitoring/metrics"), exports);
__exportStar(require("./monitoring/performance"), exports);
__exportStar(require("./monitoring/health"), exports);
// Constants - The 6 Trust Principles from Master Context
exports.TRUST_PRINCIPLES = {
    CONSENT_ARCHITECTURE: {
        weight: 0.25,
        critical: true,
        description: 'Users must explicitly consent to AI interactions and understand implications',
    },
    INSPECTION_MANDATE: {
        weight: 0.2,
        critical: false,
        description: 'All AI decisions must be inspectable and auditable',
    },
    CONTINUOUS_VALIDATION: {
        weight: 0.2,
        critical: false,
        description: 'AI behavior must be continuously validated against constitutional principles',
    },
    ETHICAL_OVERRIDE: {
        weight: 0.15,
        critical: true,
        description: 'Humans must have ability to override AI decisions on ethical grounds',
    },
    RIGHT_TO_DISCONNECT: {
        weight: 0.1,
        critical: false,
        description: 'Users can disconnect from AI systems at any time without penalty',
    },
    MORAL_RECOGNITION: {
        weight: 0.1,
        critical: false,
        description: 'AI must recognize and respect human moral agency',
    },
};
// === COHERENCE LAYER (RESONANCE) ===
__exportStar(require("./coherence/resonance-metric"), exports);
__exportStar(require("./utils/linguistic-vector-steering"), exports);
__exportStar(require("./utils/tenant-context"), exports);
__exportStar(require("./validation/schemas"), exports);
__exportStar(require("./errors/math-errors"), exports);
// Calculator V2 is in @sonate/detect (has detect dependencies)
// Import from @sonate/detect instead: import { explainableSonateResonance } from '@sonate/detect';
// Security infrastructure
var security_audit_1 = require("./security/security-audit");
Object.defineProperty(exports, "SecurityAuditor", { enumerable: true, get: function () { return security_audit_1.SecurityAuditor; } });
Object.defineProperty(exports, "runSecurityAudit", { enumerable: true, get: function () { return security_audit_1.runSecurityAudit; } });
__exportStar(require("./security/mfa-system"), exports);
var auth_service_1 = require("./security/auth-service");
Object.defineProperty(exports, "SecureAuthService", { enumerable: true, get: function () { return auth_service_1.SecureAuthService; } });
// Algorithmic constants
__exportStar(require("./constants/algorithmic"), exports);
