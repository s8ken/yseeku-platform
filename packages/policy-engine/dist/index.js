"use strict";
/**
 * @sonate/policy-engine - Policy Composition Engine
 *
 * Industry-specific trust policy composition and evaluation
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
exports.IndustryPolicies = exports.ComplianceEngine = exports.PolicyValidator = exports.PolicyEngine = void 0;
// Core policy engine
var policy_engine_1 = require("./policy-engine");
Object.defineProperty(exports, "PolicyEngine", { enumerable: true, get: function () { return policy_engine_1.PolicyEngine; } });
// Types and interfaces
__exportStar(require("./types"), exports);
// Validation
var policy_validator_1 = require("./validation/policy-validator");
Object.defineProperty(exports, "PolicyValidator", { enumerable: true, get: function () { return policy_validator_1.PolicyValidator; } });
// Compliance
var compliance_engine_1 = require("./compliance/compliance-engine");
Object.defineProperty(exports, "ComplianceEngine", { enumerable: true, get: function () { return compliance_engine_1.ComplianceEngine; } });
// Industry policies
var industry_policies_1 = require("./policies/industry-policies");
Object.defineProperty(exports, "IndustryPolicies", { enumerable: true, get: function () { return industry_policies_1.IndustryPolicies; } });
