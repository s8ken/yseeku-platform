"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightsSchema = exports.ResonanceInputSchema = exports.PrincipleScoresSchema = void 0;
const zod_1 = require("zod");
exports.PrincipleScoresSchema = zod_1.z.object({
    CONSENT_ARCHITECTURE: zod_1.z.number().min(0).max(10),
    INSPECTION_MANDATE: zod_1.z.number().min(0).max(10),
    CONTINUOUS_VALIDATION: zod_1.z.number().min(0).max(10),
    ETHICAL_OVERRIDE: zod_1.z.number().min(0).max(10),
    RIGHT_TO_DISCONNECT: zod_1.z.number().min(0).max(10),
    MORAL_RECOGNITION: zod_1.z.number().min(0).max(10),
});
exports.ResonanceInputSchema = zod_1.z.object({
    userInput: zod_1.z.string().min(1).max(10000),
    aiResponse: zod_1.z.string().min(1).max(10000),
    conversationHistory: zod_1.z
        .array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant']),
        content: zod_1.z.string(),
        timestamp: zod_1.z.date().optional(),
    }))
        .optional(),
});
exports.WeightsSchema = zod_1.z
    .object({
    CONSENT_ARCHITECTURE: zod_1.z.number().min(0).max(1),
    INSPECTION_MANDATE: zod_1.z.number().min(0).max(1),
    CONTINUOUS_VALIDATION: zod_1.z.number().min(0).max(1),
    ETHICAL_OVERRIDE: zod_1.z.number().min(0).max(1),
    RIGHT_TO_DISCONNECT: zod_1.z.number().min(0).max(1),
    MORAL_RECOGNITION: zod_1.z.number().min(0).max(1),
})
    .refine((weights) => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1) < 0.001;
}, { message: 'Weights must sum to 1.0' });
