"use strict";
/**
 * @sonate/webhook-alerts - Real-time Webhook Alerts
 *
 * Real-time webhook alerts for SONATE platform trust violations and system events
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
exports.TrustViolationAlertGenerator = exports.WebhookManager = void 0;
// Core webhook manager
var webhook_manager_1 = require("./webhook-manager");
Object.defineProperty(exports, "WebhookManager", { enumerable: true, get: function () { return webhook_manager_1.WebhookManager; } });
// Types and interfaces
__exportStar(require("./types"), exports);
// Alert generators
var trust_violation_generator_1 = require("./alerts/trust-violation-generator");
Object.defineProperty(exports, "TrustViolationAlertGenerator", { enumerable: true, get: function () { return trust_violation_generator_1.TrustViolationAlertGenerator; } });
