"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateResonanceMetrics = calculateResonanceMetrics;
const core_1 = require("@sonate/core");
function calculateResonanceMetrics(input) {
    let validated;
    try {
        const parsed = core_1.ResonanceInputSchema.parse(input);
        validated = {
            userInput: parsed.userInput,
            aiResponse: parsed.aiResponse,
            conversationHistory: parsed.conversationHistory?.map((h) => ({
                role: h.role,
                content: h.content,
                timestamp: h.timestamp || new Date(),
            })),
        };
    }
    catch (e) {
        throw new core_1.MathValidationError('Invalid resonance input', e.message);
    }
    const metrics = (0, core_1.calculateResonanceMetrics)(validated);
    if (!isFinite(metrics.R_m) || metrics.R_m < 0 || metrics.R_m > 1) {
        throw new core_1.CalculationError('Invalid R_m result', 'calculateResonanceMetrics', {
            R_m: metrics.R_m,
            inputs: input,
        });
    }
    return metrics;
}
