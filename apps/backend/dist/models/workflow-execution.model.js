"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecution = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WorkflowTaskResultSchema = new mongoose_1.Schema({
    stepId: { type: String, required: true },
    agentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Agent' },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
    input: { type: mongoose_1.Schema.Types.Mixed },
    output: { type: mongoose_1.Schema.Types.Mixed },
    error: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    trustScore: { type: Number }
});
const WorkflowExecutionSchema = new mongoose_1.Schema({
    workflowId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    tenantId: { type: String, required: true, index: true },
    status: { type: String, enum: ['running', 'completed', 'failed', 'cancelled'], default: 'running' },
    input: { type: mongoose_1.Schema.Types.Mixed },
    results: [WorkflowTaskResultSchema],
    currentStepId: { type: String },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    error: { type: String }
});
exports.WorkflowExecution = mongoose_1.default.model('WorkflowExecution', WorkflowExecutionSchema);
