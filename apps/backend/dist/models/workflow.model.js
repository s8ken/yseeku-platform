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
exports.Workflow = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WorkflowStepSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['llm', 'function', 'human_review'], default: 'llm' },
    agentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Agent' },
    role: { type: String, enum: ['coordinator', 'executor', 'validator', 'observer'] },
    inputTemplate: { type: String, default: '' },
    dependencies: [{ type: String }],
    requiredCapabilities: [{ type: String }],
    retryCount: { type: Number, default: 0 }
});
const WorkflowSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    tenantId: { type: String, required: true, index: true },
    steps: [WorkflowStepSchema],
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
    triggers: [{
            type: { type: String, enum: ['manual', 'webhook', 'schedule'], default: 'manual' },
            config: { type: mongoose_1.Schema.Types.Mixed }
        }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
WorkflowSchema.pre('save', function () {
    this.updatedAt = new Date();
});
exports.Workflow = mongoose_1.default.model('Workflow', WorkflowSchema);
