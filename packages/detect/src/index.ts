/**
 * @sonate/detect - Real-time AI Detection & Scoring
 * 
 * SONATE Detect provides real-time monitoring and scoring of AI interactions
 * using the 5-dimension SYMBI Framework.
 * 
 * HARD BOUNDARY: Production use only. For experiments, use @sonate/lab.
 */

import { TrustProtocol } from '@sonate/core';

// Core detector
export { SymbiFrameworkDetector } from './framework-detector';

// 5 Dimension scorers
export { RealityIndexCalculator } from './reality-index';
export { TrustProtocolValidator } from './trust-protocol-validator';
export { EthicalAlignmentScorer } from './ethical-alignment';
export { ResonanceQualityMeasurer } from './resonance-quality';
export { CanvasParityCalculator } from './canvas-parity';

// Types
export interface DetectionResult {
  reality_index: number;           // 0-10
  trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethical_alignment: number;       // 1-5
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvas_parity: number;           // 0-100
  timestamp: number;
  receipt_hash: string;
}

export interface AIInteraction {
  content: string;
  context: string;
  metadata: Record<string, any>;
}
