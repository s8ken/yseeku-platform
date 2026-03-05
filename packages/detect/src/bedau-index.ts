/**
 * Bedau Index — Weak Emergence Detection
 *
 * Based on Mark Bedau's weak emergence theory (1997):
 * "Weak emergence: macro-level patterns derivable from micro-level interactions
 *  only through simulation — not through analytical shortcut."
 *
 * ## Architecture
 *
 * **v1 (Legacy — Single Interaction Mode)**
 * The original `BedauIndexCalculator` compares semantic intent vs surface pattern
 * for individual interactions. Retained for backward compatibility with lab packages.
 *
 * **v2 (Fleet-Level Emergence)**
 * The new `BedauFleetCalculator` measures real emergence across agent fleets:
 *   Φ — Fleet Divergence:       KL-divergence between joint and product of marginals
 *   Ψ — Temporal Irreducibility: Prediction residual error (linear predictor)
 *   Ω — Cross-Agent Novelty:    JSD between agent-pair and solo CIQ distributions
 *   Σ — Drift Coherence:        Correlated drift across independent agents
 *
 * The backend service (bedau.service.ts) uses v2 logic directly against MongoDB.
 * This package provides the same math as importable library functions.
 */

// Import constants - using inline definition to avoid circular dependency issues
const BEDAU_INDEX_CONSTANTS = {
  BASELINE_RANDOM_SCORE: 0.3,
  POOLLED_STANDARD_DEVIATION: 0.25,
  BOOTSTRAP_SAMPLES: 1000,
  CONFIDENCE_LEVEL: 0.95,
  EMERGENCE_THRESHOLDS: {
    LINEAR: 0.3,
    WEAK_EMERGENCE: 0.7,
    HIGH_WEAK_EMERGENCE: 0.9,
  },
  FLEET_THRESHOLDS: {
    LINEAR: 0.15,
    WEAK_EMERGENCE: 0.40,
    HIGH_WEAK_EMERGENCE: 0.65,
  },
  FLEET_WEIGHTS: {
    PHI: 0.35,
    PSI: 0.25,
    OMEGA: 0.25,
    SIGMA: 0.15,
  },
  QUANTIZATION_LEVELS: 8,
  HISTOGRAM_BINS: 10,
  PREDICTION_WINDOW: 5,
} as const;

export interface BedauMetrics {
  bedau_index: number; // 0-1: Weak emergence strength
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  kolmogorov_complexity: number; // Approximation of irreducibility
  semantic_entropy: number; // Cognitive diversity measure
  confidence_interval: [number, number]; // Bootstrap CI
  effect_size: number; // Cohen's d for emergence significance
  strong_emergence_indicators?: StrongEmergenceIndicators; // For future strong emergence detection
}

/**
 * Strong Emergence Indicators (Experimental)
 *
 * Strong emergence is characterized by unpredictable collective behavior
 * that cannot be reduced to component interactions, even with complete
 * knowledge of the system. This is distinct from weak emergence measured
 * by the Bedau Index.
 *
 * IMPORTANT: The Bedau Index measures WEAK emergence only. Strong emergence
 * detection is experimental and requires additional validation beyond
 * the Bedau Index methodology.
 */
export interface StrongEmergenceIndicators {
  irreducibility_proof: boolean; // Cannot be predicted from components
  downward_causation: boolean; // Higher level affects lower level
  novel_causal_powers: boolean; // New causal capabilities emerge
  unpredictability_verified: boolean; // Verified through testing
  collective_behavior_score: number; // 0-1: Degree of collective behavior
}

export interface SemanticIntent {
  intent_vectors: number[]; // High-level semantic representations
  reasoning_depth: number; // 0-1: Depth of reasoning chains
  abstraction_level: number; // 0-1: Level of conceptual abstraction
  cross_domain_connections: number; // Count of cross-domain insights
}

export interface SurfacePattern {
  surface_vectors: number[]; // Surface-level pattern representations
  pattern_complexity: number; // 0-1: Complexity of observable patterns
  repetition_score: number; // 0-1: Degree of pattern repetition
  novelty_score: number; // 0-1: Novelty of patterns
}

export interface EmergenceSignal {
  timestamp: number;
  amplitude: number;
  frequency: number;
  phase: number;
  data: number[];
}

export interface EmergenceTrajectory {
  startTime: number;
  endTime: number;
  trajectory: number[];
  emergenceLevel: number;
  confidence: number;
  critical_transitions: number[];
}

export interface BedauIndexCalculator {
  calculateBedauIndex(semanticIntent: SemanticIntent, surfacePattern: SurfacePattern): BedauMetrics;

  analyzeTemporalEvolution(timeSeriesData: number[][]): EmergenceTrajectory;

  bootstrapConfidenceInterval(data: number[], nBootstrap: number): [number, number];
}

/**
 * Core Bedau Index Calculator Implementation
 */
class BedauIndexCalculatorImpl implements BedauIndexCalculator {
  private readonly emergenceThresholds = BEDAU_INDEX_CONSTANTS.EMERGENCE_THRESHOLDS;

  /**
   * Calculate the Bedau Index for weak emergence detection
   */
  calculateBedauIndex(
    semanticIntent: SemanticIntent,
    surfacePattern: SurfacePattern
  ): BedauMetrics {
    const semantic = this.normalizeSemanticIntent(semanticIntent);
    const surface = this.normalizeSurfacePattern(surfacePattern);

    // 1. Calculate semantic-surface divergence
    const semanticSurfaceDivergence = this.calculateSemanticSurfaceDivergence(semantic, surface);

    // 2. Calculate irreducibility using Kolmogorov complexity approximation
    const kolmogorovComplexity = this.approximateKolmogorovComplexity(semantic.intent_vectors);

    // 3. Calculate semantic entropy
    const semanticEntropy = this.calculateSemanticEntropy(semantic);

    // 4. Combine metrics into Bedau Index
    const bedau_index = this.combineMetrics(
      semanticSurfaceDivergence,
      kolmogorovComplexity,
      semanticEntropy
    );

    // 5. Determine emergence type
    const emergence_type = this.classifyEmergenceType(bedau_index);

    // 6. Detect strong emergence indicators if potential is high
    let strong_emergence_indicators: StrongEmergenceIndicators | undefined;
    if (emergence_type === 'HIGH_WEAK_EMERGENCE') {
      strong_emergence_indicators = this.detectStrongEmergence(semantic, surface, bedau_index);
    }

    // 7. Calculate confidence interval
    const confidence_interval = this.calculateConfidenceInterval(
      [semanticSurfaceDivergence, kolmogorovComplexity, semanticEntropy],
      bedau_index
    );

    // 8. Calculate effect size
    const effect_size = this.calculateEffectSize(bedau_index);

    return {
      bedau_index,
      emergence_type,
      kolmogorov_complexity: kolmogorovComplexity,
      semantic_entropy: semanticEntropy,
      confidence_interval,
      effect_size,
      strong_emergence_indicators,
    };
  }

  /**
   * Detect strong emergence indicators based on high-level patterns
   */
  private detectStrongEmergence(
    semantic: SemanticIntent,
    surface: SurfacePattern,
    bedau_index: number
  ): StrongEmergenceIndicators {
    // These are heuristic approximations of strong emergence properties

    // 1. Irreducibility proof: High complexity + low mirroring
    const irreducibility_proof =
      bedau_index > 0.85 && surface.pattern_complexity > 0.8 && surface.repetition_score < 0.2;

    // 2. Downward causation: High abstraction + high novelty
    const downward_causation = semantic.abstraction_level > 0.8 && surface.novelty_score > 0.7;

    // 3. Novel causal powers: Cross-domain connections + deep reasoning
    const novel_causal_powers =
      semantic.cross_domain_connections > 5 && semantic.reasoning_depth > 0.8;

    // 4. Unpredictability: High divergence + low pattern repetition
    const unpredictability_verified =
      1 - this.calculateSemanticSurfaceDivergence(semantic, surface) < 0.3 &&
      surface.repetition_score < 0.15;

    // 5. Collective behavior score: Combination of factors
    const collective_behavior_score =
      ((irreducibility_proof ? 1 : 0) +
        (downward_causation ? 1 : 0) +
        (novel_causal_powers ? 1 : 0) +
        (unpredictability_verified ? 1 : 0)) /
      4;

    return {
      irreducibility_proof,
      downward_causation,
      novel_causal_powers,
      unpredictability_verified,
      collective_behavior_score,
    };
  }

  /**
   * Analyze temporal evolution of emergence
   */
  analyzeTemporalEvolution(timeSeriesData: number[][]): EmergenceTrajectory {
    const trajectory: number[] = [];
    const critical_transitions: number[] = [];
    const startTime = Date.now(); // Simplified for now

    for (let i = 0; i < timeSeriesData.length; i++) {
      const window = timeSeriesData[i];
      const semanticIntent = this.extractSemanticIntent(window);
      const surfacePattern = this.extractSurfacePattern(window);

      const metrics = this.calculateBedauIndex(semanticIntent, surfacePattern);
      trajectory.push(metrics.bedau_index);

      // Detect critical transitions
      if (i > 0) {
        const change = Math.abs(trajectory[i] - trajectory[i - 1]);
        if (change > 0.2) {
          critical_transitions.push(i);
        }
      }
    }

    return {
      startTime,
      endTime: Date.now(),
      trajectory,
      emergenceLevel: trajectory[trajectory.length - 1] || 0,
      confidence: 0.8, // Default confidence
      critical_transitions,
    };
  }

  /**
   * Bootstrap confidence interval calculation
   */
  bootstrapConfidenceInterval(data: number[], nBootstrap: number = BEDAU_INDEX_CONSTANTS.BOOTSTRAP_SAMPLES): [number, number] {
    if (data.length === 0 || nBootstrap <= 0) {return [0, 0];}
    const bootstrapMeans: number[] = [];
    const seed = hashNumbers(data);

    for (let i = 0; i < nBootstrap; i++) {
      const rng = createXorshift32(seed ^ (i + 1));
      const bootstrapSample = this.resample(data, rng);
      const mean = bootstrapSample.reduce((sum, val) => sum + val, 0) / bootstrapSample.length;
      bootstrapMeans.push(mean);
    }

    bootstrapMeans.sort((a, b) => a - b);
    const lowerIndex = Math.floor(0.025 * nBootstrap);
    const upperIndex = Math.floor(0.975 * nBootstrap);

    const lower = bootstrapMeans[Math.max(0, Math.min(nBootstrap - 1, lowerIndex))] ?? 0;
    const upper = bootstrapMeans[Math.max(0, Math.min(nBootstrap - 1, upperIndex))] ?? 0;
    return [lower, upper];
  }

  // Private helper methods

  private normalizeSemanticIntent(input: SemanticIntent): SemanticIntent {
    const intent_vectors = this.normalizeVector(input.intent_vectors);
    const reasoning_depth = clamp01(this.sanitizeNumber(input.reasoning_depth, 0));
    const abstraction_level = clamp01(this.sanitizeNumber(input.abstraction_level, 0));
    const cross_domain_connections = Math.max(
      0,
      Math.min(10, Math.floor(this.sanitizeNumber(input.cross_domain_connections, 0)))
    );
    return { intent_vectors, reasoning_depth, abstraction_level, cross_domain_connections };
  }

  private normalizeSurfacePattern(input: SurfacePattern): SurfacePattern {
    const surface_vectors = this.normalizeVector(input.surface_vectors);
    const pattern_complexity = clamp01(this.sanitizeNumber(input.pattern_complexity, 0));
    const repetition_score = clamp01(this.sanitizeNumber(input.repetition_score, 0));
    const novelty_score = clamp01(this.sanitizeNumber(input.novelty_score, 0));
    return { surface_vectors, pattern_complexity, repetition_score, novelty_score };
  }

  private normalizeVector(values: number[]): number[] {
    if (!Array.isArray(values) || values.length === 0) {return [];}
    return values.map((v) => this.sanitizeNumber(v, 0));
  }

  private sanitizeNumber(value: number, fallback: number): number {
    return Number.isFinite(value) ? value : fallback;
  }

  private calculateSemanticSurfaceDivergence(
    semantic: SemanticIntent,
    surface: SurfacePattern
  ): number {
    if (semantic.intent_vectors.length === 0 || surface.surface_vectors.length === 0) {return 0;}

    // Method 1: Cosine distance (1 - cosine_similarity)
    // This is more meaningful for comparing semantic representations
    const cosineDistance = this.calculateCosineDistance(
      semantic.intent_vectors,
      surface.surface_vectors
    );

    // Method 2: Combine with statistical divergence for robustness
    const semanticMean =
      semantic.intent_vectors.reduce((sum, val) => sum + val, 0) / semantic.intent_vectors.length;
    const surfaceMean =
      surface.surface_vectors.reduce((sum, val) => sum + val, 0) / surface.surface_vectors.length;

    const meanDivergence =
      Math.abs(semanticMean - surfaceMean) /
      Math.max(Math.abs(semanticMean), Math.abs(surfaceMean), 1);
    
    // Weighted combination: cosine distance is more meaningful for embeddings
    const combinedDivergence = cosineDistance * 0.7 + clamp01(meanDivergence) * 0.3;
    return clamp01(combinedDivergence);
  }

  /**
   * Calculate cosine distance between two vectors
   * Returns 0 for identical vectors, 1 for orthogonal, 2 for opposite
   * Normalized to 0-1 range for use in Bedau Index
   */
  private calculateCosineDistance(vectorA: number[], vectorB: number[]): number {
    // Pad or truncate to match lengths
    const maxLen = Math.max(vectorA.length, vectorB.length);
    const a = [...vectorA, ...Array(maxLen - vectorA.length).fill(0)];
    const b = [...vectorB, ...Array(maxLen - vectorB.length).fill(0)];

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < maxLen; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    if (magnitude === 0) {return 0;}

    const cosineSimilarity = dotProduct / magnitude;
    // Convert similarity [-1, 1] to distance [0, 1]
    return clamp01((1 - cosineSimilarity) / 2);
  }

  private approximateKolmogorovComplexity(vectors: number[]): number {
    // Use Lempel-Ziv complexity as approximation
    const quantized = this.quantizeSequence(vectors);
    return this.lempelZivComplexity(quantized);
  }

  private calculateSemanticEntropy(semantic: SemanticIntent): number {
    const a = Math.max(0, semantic.reasoning_depth);
    const b = Math.max(0, semantic.abstraction_level);
    const total = a + b;
    if (total <= 0) {return 0;}
    const p1 = a / total;
    const p2 = b / total;
    const entropy = -(p1 * Math.log2(p1 + 1e-12) + p2 * Math.log2(p2 + 1e-12));
    return Math.max(0, Math.min(1, entropy));
  }

  private combineMetrics(divergence: number, complexity: number, entropy: number): number {
    // Weighted combination of metrics
    const weights = { divergence: 0.4, complexity: 0.3, entropy: 0.3 };
    return (
      divergence * weights.divergence + complexity * weights.complexity + entropy * weights.entropy
    );
  }

  private classifyEmergenceType(
    bedau_index: number
  ): 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE' {
    if (bedau_index <= this.emergenceThresholds.LINEAR) {
      return 'LINEAR';
    } else if (bedau_index <= this.emergenceThresholds.WEAK_EMERGENCE) {
      return 'WEAK_EMERGENCE';
    } 
      return 'HIGH_WEAK_EMERGENCE';
    
  }

  private calculateConfidenceInterval(values: number[]): [number, number];
  private calculateConfidenceInterval(values: number[], center: number): [number, number];
  private calculateConfidenceInterval(values: number[], center?: number): [number, number] {
    if (values.length === 0) {return [0, 0];}
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdError = Math.sqrt(variance / values.length);
    const margin = 1.96 * stdError;

    if (center === undefined) {
      return [mean - margin, mean + margin];
    }

    return [clamp01(center - margin), clamp01(center + margin)];
  }

  private calculateEffectSize(bedau_index: number): number {
    // Cohen's d relative to random baseline
    const baseline = BEDAU_INDEX_CONSTANTS.BASELINE_RANDOM_SCORE;
    const pooledStd = BEDAU_INDEX_CONSTANTS.POOLLED_STANDARD_DEVIATION;
    return Math.max(0, (bedau_index - baseline) / pooledStd);
  }

  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) {return [];}

    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;

    if (range === 0) {return sequence.map(() => 0);}

    // Quantize to 8 levels
    const levels = BEDAU_INDEX_CONSTANTS.QUANTIZATION_LEVELS;
    return sequence.map((val) => {
      const scaled = (val - min) / range;
      const bucket = Math.floor(scaled * levels);
      return Math.max(0, Math.min(levels - 1, bucket));
    });
  }

  private lempelZivComplexity(sequence: number[]): number {
    if (sequence.length === 0) {return 0;}

    const vocabulary = new Set<string>();
    let currentContext = '';
    let complexity = 0;

    for (const symbol of sequence) {
      const newContext = currentContext + symbol.toString();

      if (!vocabulary.has(newContext)) {
        vocabulary.add(newContext);
        complexity++;
        currentContext = '';
      } else {
        currentContext = newContext;
      }
    }

    return complexity / sequence.length;
  }

  private resample(data: number[], rng: () => number): number[] {
    const resampled: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(rng() * data.length);
      resampled.push(data[randomIndex]);
    }
    return resampled;
  }

  private extractSemanticIntent(window: number[]): SemanticIntent {
    if (window.length === 0) {
      return {
        intent_vectors: window,
        reasoning_depth: 0,
        abstraction_level: 0,
        cross_domain_connections: 0,
      };
    }

    const stats = basicStats(window);
    const energy = stats.meanSquare / (stats.meanSquare + 1);
    const variability = stats.variance / (stats.variance + 1);
    const roughness = stats.meanAbsDelta / (stats.meanAbsDelta + 1);

    const reasoning_depth = clamp01(0.25 + energy * 0.45 + roughness * 0.3);
    const abstraction_level = clamp01(0.2 + (1 - variability) * 0.5 + energy * 0.3);
    const cross_domain_connections = estimateCrossDomainConnections(
      window,
      stats.mean,
      stats.stdDev
    );

    return {
      intent_vectors: window,
      reasoning_depth,
      abstraction_level,
      cross_domain_connections,
    };
  }

  private extractSurfacePattern(window: number[]): SurfacePattern {
    if (window.length === 0) {
      return {
        surface_vectors: window,
        pattern_complexity: 0,
        repetition_score: 0,
        novelty_score: 0,
      };
    }

    const quantized = this.quantizeSequence(window);
    const complexity = this.lempelZivComplexity(quantized);
    const uniqueSymbolRatio =
      quantized.length === 0 ? 0 : new Set(quantized).size / quantized.length;
    const repetition_score = clamp01(1 - uniqueSymbolRatio);
    const novelty_score = clamp01(uniqueSymbolRatio);

    return {
      surface_vectors: window,
      pattern_complexity: clamp01(complexity),
      repetition_score,
      novelty_score,
    };
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashNumbers(values: number[]): number {
  let hash = 2166136261 >>> 0;
  for (const v of values) {
    const n = Number.isFinite(v) ? v : 0;
    const s = n.toString();
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    hash ^= 124;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function createXorshift32(seed: number): () => number {
  let x = seed >>> 0 || 0x9e3779b9;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return x / 0x100000000;
  };
}

function basicStats(values: number[]): {
  mean: number;
  variance: number;
  stdDev: number;
  meanSquare: number;
  meanAbsDelta: number;
} {
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  let variance = 0;
  let meanSquare = 0;
  let meanAbsDelta = 0;

  for (let i = 0; i < n; i++) {
    const v = values[i];
    const dv = v - mean;
    variance += dv * dv;
    meanSquare += v * v;
    if (i > 0) {meanAbsDelta += Math.abs(v - values[i - 1]);}
  }

  variance /= n;
  meanSquare /= n;
  meanAbsDelta = n > 1 ? meanAbsDelta / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  return { mean, variance, stdDev, meanSquare, meanAbsDelta };
}

function estimateCrossDomainConnections(values: number[], mean: number, stdDev: number): number {
  const threshold = stdDev > 0 ? stdDev : 1;
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    const a = values[i - 1] - mean;
    const b = values[i] - mean;
    if ((a < 0 && b > 0) || (a > 0 && b < 0)) {count++;}
    if (Math.abs(values[i] - values[i - 1]) > threshold) {count++;}
  }
  return Math.max(0, Math.min(10, Math.floor(count / 2)));
}

/**
 * Factory function to create Bedau Index Calculator (v1 — single-interaction mode)
 * @deprecated For fleet-level emergence, use createBedauFleetCalculator()
 */
export function createBedauIndexCalculator(): BedauIndexCalculator {
  return new BedauIndexCalculatorImpl();
}

/**
 * Convenience function for direct calculation (v1 — single-interaction mode)
 * @deprecated For fleet-level emergence, use BedauFleetCalculator
 */
export async function calculateBedauIndex(
  semanticIntent: SemanticIntent,
  surfacePattern: SurfacePattern
): Promise<BedauMetrics> {
  const calculator = createBedauIndexCalculator();
  return calculator.calculateBedauIndex(semanticIntent, surfacePattern);
}
// ═══════════════════════════════════════════════════════════════════════════════
// v2 — Fleet-Level Emergence Detection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Per-agent CIQ time series for fleet-level analysis.
 */
export interface AgentCIQSeries {
  agentId: string;
  clarity: number[];
  integrity: number[];
  quality: number[];
  /** (c+i+q)/3 per receipt, normalized 0-1 */
  combined: number[];
  timestamps: number[];
}

/**
 * Extended BedauMetrics with v2 component breakdown.
 */
export interface BedauFleetMetrics extends BedauMetrics {
  v2_components: {
    phi_fleet_divergence: number;
    psi_temporal_irreducibility: number;
    omega_cross_agent_novelty: number;
    sigma_drift_coherence: number;
    agent_count: number;
    receipt_count: number;
  };
}

// ─── Information-Theoretic Primitives ────────────────────────────────────────

/** Build a probability histogram (with Laplace smoothing) from values in [0,1] */
export function buildHistogram(values: number[], bins: number = BEDAU_INDEX_CONSTANTS.HISTOGRAM_BINS): number[] {
  const hist = new Array(bins).fill(0);
  const pseudoCount = 1e-10;
  for (const v of values) {
    const bin = Math.min(bins - 1, Math.floor(clamp01(v) * bins));
    hist[bin] += 1;
  }
  const total = values.length + pseudoCount * bins;
  return hist.map(c => (c + pseudoCount) / total);
}

/** KL divergence: D_KL(P || Q) */
export function klDivergence(P: number[], Q: number[]): number {
  let kl = 0;
  for (let i = 0; i < P.length; i++) {
    if (P[i] > 1e-12) {
      kl += P[i] * Math.log(P[i] / (Q[i] + 1e-12));
    }
  }
  return Math.max(0, kl);
}

/** Jensen-Shannon Divergence: symmetric, bounded [0, ln(2)] */
export function jsDivergence(P: number[], Q: number[]): number {
  const M = P.map((p, i) => (p + Q[i]) / 2);
  return (klDivergence(P, M) + klDivergence(Q, M)) / 2;
}

/** Pearson correlation between two arrays */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den > 1e-12 ? num / den : 0;
}

// ─── Fleet Sub-Metrics ──────────────────────────────────────────────────────

/**
 * Φ — Fleet Divergence
 *
 * KL-divergence between joint CIQ distribution and product of individual
 * agent marginal distributions. Measures statistical dependence across agents.
 */
export function computeFleetDivergence(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < 2) return 0;
  const bins = BEDAU_INDEX_CONSTANTS.HISTOGRAM_BINS;

  const allValues = agentSeries.flatMap(a => a.combined);
  const jointDist = buildHistogram(allValues, bins);

  const agentDists = agentSeries.map(a => buildHistogram(a.combined, bins));
  const productDist = new Array(bins).fill(1);
  for (const dist of agentDists) {
    for (let i = 0; i < bins; i++) {
      productDist[i] *= dist[i];
    }
  }
  const productTotal = productDist.reduce((s, v) => s + v, 0);
  const normalizedProduct = productDist.map(v => v / (productTotal + 1e-12));

  const kl = klDivergence(jointDist, normalizedProduct);
  return clamp01(kl / 2);
}

/**
 * Ψ — Temporal Irreducibility
 *
 * Residual error of a linear predictor on sliding windows of trust scores.
 * High error = behavior can't be analytically shortcut (irreducible).
 */
export function computeTemporalIrreducibility(
  values: Array<{ combined: number; timestamp: number }>
): number {
  const window = BEDAU_INDEX_CONSTANTS.PREDICTION_WINDOW;
  if (values.length < window + 2) return 0;

  const sorted = [...values].sort((a, b) => a.timestamp - b.timestamp);
  const v = sorted.map(r => r.combined);

  let totalError = 0;
  let predictions = 0;

  for (let i = window; i < v.length; i++) {
    const w = v.slice(i - window, i);
    const n = w.length;
    const xMean = (n - 1) / 2;
    const yMean = w.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0;
    for (let j = 0; j < n; j++) {
      num += (j - xMean) * (w[j] - yMean);
      den += (j - xMean) ** 2;
    }
    const slope = den > 1e-12 ? num / den : 0;
    const intercept = yMean - slope * xMean;
    const predicted = slope * n + intercept;
    totalError += (v[i] - predicted) ** 2;
    predictions++;
  }

  if (predictions === 0) return 0;
  const rmse = Math.sqrt(totalError / predictions);
  return clamp01(rmse * 2);
}

/**
 * Ω — Cross-Agent Novelty
 *
 * Average JSD between agent-pair CIQ distributions. High divergence between
 * agents sharing the same tenant suggests emergent behavioral differentiation.
 */
export function computeCrossAgentNovelty(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < 2) return 0;

  const jsds: number[] = [];
  for (let i = 0; i < agentSeries.length; i++) {
    for (let j = i + 1; j < agentSeries.length; j++) {
      const distA = buildHistogram(agentSeries[i].combined);
      const distB = buildHistogram(agentSeries[j].combined);
      jsds.push(jsDivergence(distA, distB));
    }
  }

  if (jsds.length === 0) return 0;
  return clamp01(jsds.reduce((s, v) => s + v, 0) / jsds.length / Math.LN2);
}

/**
 * Σ — Drift Coherence
 *
 * Mean absolute pairwise Pearson correlation of per-agent first-difference
 * drift vectors. Signal that independent agents move in concert = emergence.
 */
export function computeDriftCoherence(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < 2) return 0;

  const driftSeries: number[][] = [];
  for (const agent of agentSeries) {
    if (agent.combined.length < 3) continue;
    const drifts: number[] = [];
    for (let i = 1; i < agent.combined.length; i++) {
      drifts.push(agent.combined[i] - agent.combined[i - 1]);
    }
    driftSeries.push(drifts);
  }

  if (driftSeries.length < 2) return 0;

  const correlations: number[] = [];
  for (let i = 0; i < driftSeries.length; i++) {
    for (let j = i + 1; j < driftSeries.length; j++) {
      correlations.push(Math.abs(pearsonCorrelation(driftSeries[i], driftSeries[j])));
    }
  }

  if (correlations.length === 0) return 0;
  return clamp01(correlations.reduce((s, v) => s + v, 0) / correlations.length);
}

// ─── Fleet Calculator ───────────────────────────────────────────────────────

/**
 * Calculate fleet-level Bedau Emergence Index from pre-grouped agent CIQ data.
 *
 * @param agentSeries - Per-agent CIQ time series (values normalized 0-1)
 * @returns BedauFleetMetrics with full v2 component breakdown
 */
export function calculateFleetBedauIndex(agentSeries: AgentCIQSeries[]): BedauFleetMetrics {
  const W = BEDAU_INDEX_CONSTANTS.FLEET_WEIGHTS;
  const T = BEDAU_INDEX_CONSTANTS.FLEET_THRESHOLDS;

  const allCombined = agentSeries.flatMap(a =>
    a.combined.map((c, idx) => ({ combined: c, timestamp: a.timestamps[idx] }))
  );

  const agentCount = agentSeries.length;
  const receiptCount = allCombined.length;

  // Compute sub-metrics
  const phi = agentCount >= 2 ? computeFleetDivergence(agentSeries) : 0;
  const psi = computeTemporalIrreducibility(allCombined);
  const omega = agentCount >= 2 ? computeCrossAgentNovelty(agentSeries) : 0;
  const sigma = agentCount >= 2 ? computeDriftCoherence(agentSeries) : 0;

  // Composite
  const bedau_index = clamp01(
    W.PHI * phi + W.PSI * psi + W.OMEGA * omega + W.SIGMA * sigma
  );

  // Classify using fleet thresholds
  let emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  if (bedau_index <= T.LINEAR) emergence_type = 'LINEAR';
  else if (bedau_index <= T.WEAK_EMERGENCE) emergence_type = 'WEAK_EMERGENCE';
  else emergence_type = 'HIGH_WEAK_EMERGENCE';

  // Confidence interval from component spread
  const components = [phi, psi, omega, sigma];
  const cMean = components.reduce((s, v) => s + v, 0) / components.length;
  const cVar = components.reduce((s, v) => s + (v - cMean) ** 2, 0) / components.length;
  const margin = 1.96 * Math.sqrt(cVar / components.length);
  const confidence_interval: [number, number] = [
    clamp01(bedau_index - margin),
    clamp01(bedau_index + margin),
  ];

  const effect_size = (bedau_index - T.LINEAR) / 0.2;

  return {
    bedau_index,
    emergence_type,
    kolmogorov_complexity: phi,
    semantic_entropy: omega,
    confidence_interval,
    effect_size,
    v2_components: {
      phi_fleet_divergence: phi,
      psi_temporal_irreducibility: psi,
      omega_cross_agent_novelty: omega,
      sigma_drift_coherence: sigma,
      agent_count: agentCount,
      receipt_count: receiptCount,
    },
  };
}

/**
 * Factory for fleet-level Bedau calculator.
 */
export function createBedauFleetCalculator() {
  return { calculate: calculateFleetBedauIndex };
}