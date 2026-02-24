// @sonate/detect/calculator.ts
// MIGRATION: This file now delegates to @sonate/calculator (V2)
// The legacy implementation has been removed in favor of the single source of truth.

// DISABLED: @sonate/calculator not yet built - disabling all exports
// import {
//   CalculatorV2,
//   Transcript,
//   RobustResonanceResult,
//   ExplainedResonance,
//   EvidenceChunk,
//   DimensionEvidence
// } from '@sonate/calculator';

// // Export types for backward compatibility
// export {
//   Transcript,
//   RobustResonanceResult,
//   ExplainedResonance,
//   EvidenceChunk,
//   DimensionEvidence
// };

// /**
//  * Enhanced main function with all mathematical improvements
//  * Delegates fully to CalculatorV2
//  */
// export async function robustSonateResonance(transcript: Transcript): Promise<RobustResonanceResult> {
//   return CalculatorV2.compute(transcript);
// }

// DISABLED: @sonate/calculator (V2) not yet built.
// The functions and constants below referenced CalculatorV2 which doesn't exist,
// causing a ReferenceError at runtime. Stubbed until the calculator package ships.

export interface Transcript {
  text: string;
  turns?: { role: string; content: string }[];
}

export interface ExplainedResonance {
  r_m: number;
  stakes: { level: string; score: number };
  adversarial: { detected: boolean; score: number };
  breakdown: Record<string, number>;
  top_evidence: string[];
  audit_trail: string[];
}

/**
 * Explainable resonance function with detailed evidence
 * Delegates fully to CalculatorV2 — STUBBED until @sonate/calculator is ready
 */
export async function explainableSonateResonance(
  _transcript: Transcript,
  _options: { max_evidence?: number } = {}
): Promise<ExplainedResonance> {
  throw new Error('@sonate/calculator is not yet built — explainableSonateResonance is unavailable');
}

// Re-export constants — stubbed as empty objects until @sonate/calculator ships
export const DYNAMIC_THRESHOLDS: Record<string, number> = {};
export const CANONICAL_WEIGHTS: Record<string, number> = {};

// Deprecated: These were internal helpers, likely not used outside,
// but keeping empty/logging versions just in case of deep imports during migration.
// In a stricter migration, we would remove these entirely.
