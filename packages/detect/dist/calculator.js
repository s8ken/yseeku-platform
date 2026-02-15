"use strict";
// @sonate/detect/calculator.ts
// MIGRATION: This file now delegates to @sonate/calculator (V2)
// The legacy implementation has been removed in favor of the single source of truth.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_WEIGHTS = exports.DYNAMIC_THRESHOLDS = void 0;
exports.robustSonateResonance = robustSonateResonance;
exports.explainableSonateResonance = explainableSonateResonance;
const calculator_1 = require("@sonate/calculator");
/**
 * Enhanced main function with all mathematical improvements
 * Delegates fully to CalculatorV2
 */
async function robustSonateResonance(transcript) {
    return calculator_1.CalculatorV2.compute(transcript);
}
/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2
 */
async function explainableSonateResonance(transcript, options = {}) {
    return calculator_1.CalculatorV2.computeExplainable(transcript, options);
}
// Re-export constants if needed by consumers (though they should prefer the package)
exports.DYNAMIC_THRESHOLDS = calculator_1.CalculatorV2.DYNAMIC_THRESHOLDS;
exports.CANONICAL_WEIGHTS = calculator_1.CalculatorV2.CANONICAL_WEIGHTS;
// Deprecated: These were internal helpers, likely not used outside,
// but keeping empty/logging versions just in case of deep imports during migration.
// In a stricter migration, we would remove these entirely.
