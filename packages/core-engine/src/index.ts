/**
 * SYMBI Core Engine - Phase 2 Complete Architecture
 * 
 * Enterprise-grade AI governance with objective measurement (Overseer),
 * interpretive analysis (SYMBI), and explicit layer mapping.
 * 
 * Architecture:
 * - Overseer: Pure JSON measurement engine (no interpretation)
 * - SYMBI: Interpretation and audit layer (consumes Overseer data)
 * - LayerMapper: Explicit Layer 1 ↔ Layer 2 mapping functions
 * - Foundation: Real embeddings with bounded resonance metrics
 * 
 * Key Principles:
 * - Mathematical rigor over heuristics
 * - Architectural separation of concerns
 * - Explicit, inspectable mappings
 * - Enterprise-ready compliance and audit
 */

// Foundation - Phase 1 Components
export { OpenAIEmbeddingClient, LocalEmbeddingClient, EmbeddingClient } from './embedding-client';
export { SemanticMetrics } from './semantic-metrics';
export { ResonanceCalculator } from './resonance';

// Phase 2 - Architecture Components
export { Overseer } from './overseer';
export { Symbi } from './symbi';
export { LayerMapper, DEFAULT_MAPPING_CONFIG } from './layer-mapping';

// Validation and Testing
export { runMathematicalTests, validateMathematicalProperties } from './tests/mathematical-tests';
export { runArchitectureTests, ArchitectureTests } from './tests/architecture-tests';

// Demo and Examples
export { runCoreEngineDemo, runQuickDemo as runPhase1Demo } from './demo';
export { runPhase2Demo, runQuickDemo, Phase2ArchitectureDemo } from './demo-architecture';

// Types and Interfaces - Core Engine
export type { 
  EmbeddingRequest, 
  EmbeddingResponse, 
  SemanticMetricsResult,
  ResonanceResult,
  ResonanceConfig
} from './embedding-client';

// Types and Interfaces - Phase 2 Architecture
export type { 
  // Overseer types
  InteractionData,
  Layer1Principles,
  Layer2Metrics,
  OverseerResult,
  OverseerConfig
} from './overseer';

export type { 
  // SYMBI types
  SymbiExplanation,
  AnomalyDetection,
  ComplianceMapping,
  SymbiConfig,
  Audience
} from './symbi';

export type { 
  // Layer Mapping types
  MappingConfig,
  MappingResult
} from './layer-mapping';

// Convenience exports for common usage
export { defaultLayerMapper, mapLayer2ToLayer1, analyzeMapping } from './layer-mapping';