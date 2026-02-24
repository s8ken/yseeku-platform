"use strict";
// @sonate/detect/calculator.ts
// MIGRATION: This file now delegates to @sonate/calculator (V2)
// The legacy implementation has been removed in favor of the single source of truth.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_WEIGHTS = exports.DYNAMIC_THRESHOLDS = void 0;
exports.explainableSonateResonance = explainableSonateResonance;
/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2 — STUBBED until @sonate/calculator is ready
 */
async function explainableSonateResonance(_transcript, _options = {}) {
    throw new Error('@sonate/calculator is not yet built — explainableSonateResonance is unavailable');
}
// Re-export constants — stubbed as empty objects until @sonate/calculator ships
exports.DYNAMIC_THRESHOLDS = {};
exports.CANONICAL_WEIGHTS = {};
// Deprecated: These were internal helpers, likely not used outside,
// but keeping empty/logging versions just in case of deep imports during migration.
// In a stricter migration, we would remove these entirely.
