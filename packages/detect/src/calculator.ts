// @sonate/detect/calculator.ts
// MIGRATION: This file now delegates to @sonate/calculator (V2)
// The legacy implementation has been removed in favor of the single source of truth.

import {
  CalculatorV2,
  Transcript,
  RobustResonanceResult,
  ExplainedResonance,
  EvidenceChunk,
  DimensionEvidence
} from '@sonate/calculator';

// Export types for backward compatibility
export {
  Transcript,
  RobustResonanceResult,
  ExplainedResonance,
  EvidenceChunk,
  DimensionEvidence
};

/**
 * Enhanced main function with all mathematical improvements
 * Delegates fully to CalculatorV2
 */
export async function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult> {
  return CalculatorV2.compute(transcript);
}

/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2
 */
export async function explainableSonateResonance(
  transcript: Transcript,
  options: { max_evidence?: number } = {}
): Promise<ExplainedResonance> {
  return CalculatorV2.computeExplainable(transcript, options);
}

// Re-export constants if needed by consumers (though they should prefer the package)
export const DYNAMIC_THRESHOLDS = CalculatorV2.DYNAMIC_THRESHOLDS;
export const CANONICAL_WEIGHTS = CalculatorV2.CANONICAL_WEIGHTS;

// Deprecated: These were internal helpers, likely not used outside,
// but keeping empty/logging versions just in case of deep imports during migration.
// In a stricter migration, we would remove these entirely.
