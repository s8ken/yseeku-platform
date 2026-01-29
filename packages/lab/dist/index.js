"use strict";
/**
 * @sonate/lab - Double-Blind Experimentation & Research
 *
 * SONATE Lab provides isolated sandbox environments for controlled
 * experiments to prove causality and validate AI improvements.
 *
 * HARD BOUNDARY: Research use only. No production data. No real users.
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
exports.AGENT_ROLES = exports.ArchiveAnalyzer = exports.ConversationalMetrics = exports.MultiAgentSystem = exports.DoubleBlindProtocol = exports.ExperimentOrchestrator = void 0;
// Core orchestrator
var experiment_orchestrator_1 = require("./experiment-orchestrator");
Object.defineProperty(exports, "ExperimentOrchestrator", { enumerable: true, get: function () { return experiment_orchestrator_1.ExperimentOrchestrator; } });
// Protocols and agents
var double_blind_protocol_1 = require("./double-blind-protocol");
Object.defineProperty(exports, "DoubleBlindProtocol", { enumerable: true, get: function () { return double_blind_protocol_1.DoubleBlindProtocol; } });
var multi_agent_system_1 = require("./multi-agent-system");
Object.defineProperty(exports, "MultiAgentSystem", { enumerable: true, get: function () { return multi_agent_system_1.MultiAgentSystem; } });
// Conversational metrics and archive analysis
var conversational_metrics_1 = require("./conversational-metrics");
Object.defineProperty(exports, "ConversationalMetrics", { enumerable: true, get: function () { return conversational_metrics_1.ConversationalMetrics; } });
var archive_analyzer_1 = require("./archive-analyzer");
Object.defineProperty(exports, "ArchiveAnalyzer", { enumerable: true, get: function () { return archive_analyzer_1.ArchiveAnalyzer; } });
// Agent roles (from sonate-resonate Lab)
exports.AGENT_ROLES = ['CONDUCTOR', 'VARIANT', 'EVALUATOR', 'OVERSEER'];
// Export types from types module
__exportStar(require("./types"), exports);
