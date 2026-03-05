/**
 * Bedau Emergence Index v2 — Fleet-Level Weak Emergence Detection
 *
 * Based on Mark Bedau's weak emergence theory (1997):
 * "Weak emergence: macro-level patterns derivable from micro-level interactions
 *  only through simulation — not through analytical shortcut."
 *
 * v2 measures actual collective emergence across the agent fleet by comparing
 * individual agent behaviors to system-level patterns. This replaces the v1
 * implementation which operated on averaged scalars and hash noise.
 *
 * Four sub-metrics:
 *   Φ — Fleet Divergence:     KL-divergence between joint and product of marginals
 *   Ψ — Temporal Irreducibility: Prediction residual error
 *   Ω — Cross-Agent Novelty:  JSD between interaction and solo CIQ distributions
 *   Σ — Drift Coherence:      Correlated drift across unrelated agents
 */

import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// ─── Public Interfaces (unchanged for backward compatibility) ────────────────

export interface BedauMetrics {
  bedau_index: number;
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  kolmogorov_complexity: number; // v2: repurposed as Φ (fleet divergence)
  semantic_entropy: number;      // v2: repurposed as Ω (cross-agent novelty)
  confidence_interval: [number, number];
  effect_size: number;
  // v2 additions (optional, won't break existing consumers)
  v2_components?: {
    phi_fleet_divergence: number;
    psi_temporal_irreducibility: number;
    omega_cross_agent_novelty: number;
    sigma_drift_coherence: number;
    agent_count: number;
    receipt_count: number;
  };
}

export interface EmergenceTrajectory {
  startTime: number;
  endTime: number;
  trajectory: number[];
  emergenceLevel: number;
  confidence: number;
  critical_transitions: number[];
}

// ─── Internal Types ──────────────────────────────────────────────────────────

interface AgentCIQSeries {
  agentId: string;
  clarity: number[];
  integrity: number[];
  quality: number[];
  combined: number[];   // (c+i+q)/3 per receipt, normalized 0-1
  timestamps: number[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  LINEAR: 0.15,
  WEAK_EMERGENCE: 0.40,
  HIGH_WEAK_EMERGENCE: 0.65,
} as const;

const WEIGHTS = {
  PHI: 0.35,   // Fleet Divergence
  PSI: 0.25,   // Temporal Irreducibility
  OMEGA: 0.25, // Cross-Agent Novelty
  SIGMA: 0.15, // Drift Coherence
} as const;

const MIN_AGENTS = 2;       // Need ≥2 agents for emergence
const MIN_RECEIPTS = 10;    // Need some data per agent
const HISTOGRAM_BINS = 10;  // For distribution comparisons
const PREDICTION_WINDOW = 5; // Sliding window for linear predictor

// ─── Utility Functions ───────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Normalize a CIQ value to 0-1 (handles both 0-1 and 0-5 scales) */
function normalizeCIQ(v: number): number {
  if (v > 1) return clamp01(v / 5);
  return clamp01(v);
}

/** Build a histogram (probability distribution) from values in [0,1] */
function buildHistogram(values: number[], bins: number = HISTOGRAM_BINS): number[] {
  const hist = new Array(bins).fill(0);
  const pseudoCount = 1e-10; // Laplace smoothing
  for (const v of values) {
    const bin = Math.min(bins - 1, Math.floor(v * bins));
    hist[bin] += 1;
  }
  const total = values.length + pseudoCount * bins;
  return hist.map(c => (c + pseudoCount) / total);
}

/** KL divergence: D_KL(P || Q) — measures how P diverges from Q */
function klDivergence(P: number[], Q: number[]): number {
  let kl = 0;
  for (let i = 0; i < P.length; i++) {
    if (P[i] > 1e-12) {
      kl += P[i] * Math.log(P[i] / (Q[i] + 1e-12));
    }
  }
  return Math.max(0, kl);
}

/** Jensen-Shannon Divergence: symmetric, bounded [0, ln(2)] ≈ [0, 0.693] */
function jsDivergence(P: number[], Q: number[]): number {
  const M = P.map((p, i) => (p + Q[i]) / 2);
  return (klDivergence(P, M) + klDivergence(Q, M)) / 2;
}

/** Mean of an array */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Variance of an array */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

/** Pearson correlation between two equal-length arrays */
function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
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

// ─── Core v2 Sub-Metrics ─────────────────────────────────────────────────────

/**
 * Φ — Fleet Divergence
 *
 * Measures whether the joint CIQ distribution across all agents differs from
 * the product of individual agent distributions. If agents are statistically
 * independent, Φ ≈ 0. If they're correlated in unexpected ways, Φ is high.
 *
 * Uses KL divergence: D_KL( P_joint || Π P_individual )
 */
function computeFleetDivergence(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < MIN_AGENTS) return 0;

  // Build joint distribution: histogram of all combined CIQ values across all agents
  const allValues = agentSeries.flatMap(a => a.combined);
  const jointDist = buildHistogram(allValues);

  // Build product of marginals: multiply per-agent histograms, then normalize
  const agentDists = agentSeries.map(a => buildHistogram(a.combined));
  const productDist = new Array(HISTOGRAM_BINS).fill(1);
  for (const dist of agentDists) {
    for (let i = 0; i < HISTOGRAM_BINS; i++) {
      productDist[i] *= dist[i];
    }
  }
  const productTotal = productDist.reduce((s, v) => s + v, 0);
  const normalizedProduct = productDist.map(v => v / (productTotal + 1e-12));

  // KL divergence, normalized to [0, 1]
  const kl = klDivergence(jointDist, normalizedProduct);
  // Normalize: KL can be unbounded, but for practical CIQ data it rarely exceeds ~2
  return clamp01(kl / 2);
}

/**
 * Ψ — Temporal Irreducibility
 *
 * Measures whether current fleet trust state is predictable from recent history.
 * Trains a simple linear predictor on sliding windows; the residual error is
 * the irreducibility signal. High error = behavior can't be analytically shortcut.
 */
function computeTemporalIrreducibility(allReceipts: Array<{ combined: number; timestamp: number }>): number {
  if (allReceipts.length < PREDICTION_WINDOW + 2) return 0;

  // Sort by time (oldest first)
  const sorted = [...allReceipts].sort((a, b) => a.timestamp - b.timestamp);
  const values = sorted.map(r => r.combined);

  // Linear predictor: for each window, predict next value as linear extrapolation
  let totalError = 0;
  let predictions = 0;

  for (let i = PREDICTION_WINDOW; i < values.length; i++) {
    const window = values.slice(i - PREDICTION_WINDOW, i);
    // Simple linear regression on window indices
    const n = window.length;
    const xMean = (n - 1) / 2;
    const yMean = mean(window);
    let num = 0, den = 0;
    for (let j = 0; j < n; j++) {
      num += (j - xMean) * (window[j] - yMean);
      den += (j - xMean) ** 2;
    }
    const slope = den > 1e-12 ? num / den : 0;
    const intercept = yMean - slope * xMean;
    const predicted = slope * n + intercept; // Predict next point
    const actual = values[i];
    totalError += (actual - predicted) ** 2;
    predictions++;
  }

  if (predictions === 0) return 0;
  // RMSE normalized — for 0-1 data, max RMSE ≈ 0.5 in practice
  const rmse = Math.sqrt(totalError / predictions);
  return clamp01(rmse * 2); // Scale so RMSE of 0.5 → 1.0
}

/**
 * Ω — Cross-Agent Novelty
 *
 * For each agent pair, compares the JSD between their CIQ distributions.
 * High divergence between agents that share the same tenant/context suggests
 * emergent differentiation — agents developing distinct behavioral profiles
 * not present in their shared training/configuration.
 */
function computeCrossAgentNovelty(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < MIN_AGENTS) return 0;

  const jsds: number[] = [];
  for (let i = 0; i < agentSeries.length; i++) {
    for (let j = i + 1; j < agentSeries.length; j++) {
      const distA = buildHistogram(agentSeries[i].combined);
      const distB = buildHistogram(agentSeries[j].combined);
      jsds.push(jsDivergence(distA, distB));
    }
  }

  if (jsds.length === 0) return 0;
  // Normalize: max JSD = ln(2) ≈ 0.693
  const avgJSD = mean(jsds);
  return clamp01(avgJSD / Math.LN2);
}

/**
 * Σ — Drift Coherence
 *
 * Computes per-agent trust score drift vectors over time, then measures
 * average pairwise correlation. If agents that share no direct interactions
 * drift in the same direction, that's a macro-level pattern not explained
 * by micro-level inputs — a hallmark of weak emergence.
 */
function computeDriftCoherence(agentSeries: AgentCIQSeries[]): number {
  if (agentSeries.length < MIN_AGENTS) return 0;

  // Compute drift series for each agent: first-differences of combined CIQ
  const driftSeries: number[][] = [];
  for (const agent of agentSeries) {
    if (agent.combined.length < 3) continue; // Need at least 3 points for drift
    const drifts: number[] = [];
    for (let i = 1; i < agent.combined.length; i++) {
      drifts.push(agent.combined[i] - agent.combined[i - 1]);
    }
    driftSeries.push(drifts);
  }

  if (driftSeries.length < MIN_AGENTS) return 0;

  // Pairwise correlation of drift vectors
  const correlations: number[] = [];
  for (let i = 0; i < driftSeries.length; i++) {
    for (let j = i + 1; j < driftSeries.length; j++) {
      const r = pearsonCorrelation(driftSeries[i], driftSeries[j]);
      correlations.push(Math.abs(r)); // Absolute correlation — both positive and negative coherence matter
    }
  }

  if (correlations.length === 0) return 0;
  // Mean absolute correlation: 0 = independent drift, 1 = perfectly correlated drift
  return clamp01(mean(correlations));
}

// ─── Main Calculator ─────────────────────────────────────────────────────────

function classify(index: number): 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE' {
  if (index <= THRESHOLDS.LINEAR) return 'LINEAR';
  if (index <= THRESHOLDS.WEAK_EMERGENCE) return 'WEAK_EMERGENCE';
  return 'HIGH_WEAK_EMERGENCE';
}

function calculateConfidenceInterval(components: number[], center: number): [number, number] {
  if (components.length === 0) return [0, 0];
  const m = mean(components);
  const v = variance(components);
  const se = Math.sqrt(v / components.length);
  const margin = 1.96 * se;
  return [clamp01(center - margin), clamp01(center + margin)];
}

// ─── Exported Service ────────────────────────────────────────────────────────

export const bedauService = {
  /**
   * Calculate fleet-level Bedau Emergence Index from trust receipt data.
   *
   * Pipeline:
   * 1. Fetch recent receipts for the tenant
   * 2. Group by agent_id
   * 3. Compute four sub-metrics across the agent fleet
   * 4. Combine into composite Bedau Index
   * 5. Compute trajectory via sliding window
   */
  async getMetrics(tenantId: string): Promise<BedauMetrics & { trajectory: EmergenceTrajectory }> {
    try {
      // 1. Fetch recent receipts (more data = better emergence signal)
      const receipts = await TrustReceiptModel.find({ tenant_id: tenantId })
        .sort({ timestamp: -1 })
        .limit(500)
        .select('ciq_metrics timestamp agent_id self_hash')
        .lean();

      if (receipts.length < MIN_RECEIPTS) {
        return baselineResult();
      }

      // 2. Group by agent, normalize CIQ
      const agentMap = new Map<string, AgentCIQSeries>();
      const allCombined: Array<{ combined: number; timestamp: number }> = [];

      for (const r of receipts) {
        const agentId = (r as any).agent_id || 'unknown';
        const c = normalizeCIQ(r.ciq_metrics?.clarity || 0);
        const i = normalizeCIQ(r.ciq_metrics?.integrity || 0);
        const q = normalizeCIQ(r.ciq_metrics?.quality || 0);
        const combined = (c + i + q) / 3;
        const ts = typeof r.timestamp === 'number' ? r.timestamp : new Date(r.timestamp).getTime();

        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            agentId,
            clarity: [], integrity: [], quality: [], combined: [], timestamps: [],
          });
        }
        const series = agentMap.get(agentId)!;
        series.clarity.push(c);
        series.integrity.push(i);
        series.quality.push(q);
        series.combined.push(combined);
        series.timestamps.push(ts);

        allCombined.push({ combined, timestamp: ts });
      }

      const agentSeries = Array.from(agentMap.values());
      const agentCount = agentSeries.length;

      // 3. Compute sub-metrics
      let phi: number, psi: number, omega: number, sigma: number;

      if (agentCount < MIN_AGENTS) {
        // Single agent: can still measure temporal irreducibility
        // but fleet metrics are zeroed — emergence requires multiple components
        phi = 0;
        omega = 0;
        sigma = 0;
        psi = computeTemporalIrreducibility(allCombined);
      } else {
        phi = computeFleetDivergence(agentSeries);
        psi = computeTemporalIrreducibility(allCombined);
        omega = computeCrossAgentNovelty(agentSeries);
        sigma = computeDriftCoherence(agentSeries);
      }

      // 4. Composite index
      const bedau_index = clamp01(
        WEIGHTS.PHI * phi +
        WEIGHTS.PSI * psi +
        WEIGHTS.OMEGA * omega +
        WEIGHTS.SIGMA * sigma
      );

      const emergence_type = classify(bedau_index);
      const components = [phi, psi, omega, sigma];
      const confidence_interval = calculateConfidenceInterval(components, bedau_index);
      const effect_size = (bedau_index - THRESHOLDS.LINEAR) / 0.2; // Standardized against baseline

      // 5. Trajectory: sliding window over time
      const sorted = [...allCombined].sort((a, b) => a.timestamp - b.timestamp);
      const trajectoryData: number[] = [];
      const windowSize = Math.max(10, Math.floor(sorted.length / 10));
      const critical_transitions: number[] = [];

      for (let idx = 0; idx <= sorted.length - windowSize; idx += Math.max(1, Math.floor(windowSize / 2))) {
        const window = sorted.slice(idx, idx + windowSize);
        // Build mini fleet divergence for this window
        const windowValues = window.map(w => w.combined);
        const windowVar = variance(windowValues);
        // Approximate emergence in window via normalized variance + prediction residual
        const windowPredErr = computeTemporalIrreducibility(window);
        const windowScore = clamp01(windowVar * 4 + windowPredErr * 0.5);
        trajectoryData.push(windowScore);

        // Detect critical transitions (jumps > 0.15)
        if (trajectoryData.length > 1) {
          const jump = Math.abs(trajectoryData[trajectoryData.length - 1] - trajectoryData[trajectoryData.length - 2]);
          if (jump > 0.15) {
            critical_transitions.push(trajectoryData.length - 1);
          }
        }
      }

      const trajectory: EmergenceTrajectory = {
        startTime: sorted.length > 0 ? sorted[0].timestamp : Date.now(),
        endTime: sorted.length > 0 ? sorted[sorted.length - 1].timestamp : Date.now(),
        trajectory: trajectoryData,
        emergenceLevel: bedau_index,
        confidence: agentCount >= MIN_AGENTS ? 0.85 : 0.4, // Lower confidence with single agent
        critical_transitions,
      };

      logger.debug('Bedau v2 metrics computed', {
        tenantId,
        agentCount,
        receipts: receipts.length,
        phi, psi, omega, sigma,
        bedau_index,
        emergence_type,
      });

      return {
        bedau_index,
        emergence_type,
        kolmogorov_complexity: phi,   // Map to legacy field name
        semantic_entropy: omega,       // Map to legacy field name
        confidence_interval,
        effect_size,
        v2_components: {
          phi_fleet_divergence: phi,
          psi_temporal_irreducibility: psi,
          omega_cross_agent_novelty: omega,
          sigma_drift_coherence: sigma,
          agent_count: agentCount,
          receipt_count: receipts.length,
        },
        trajectory,
      };

    } catch (error: unknown) {
      logger.error('Error calculating Bedau v2 metrics', { error: getErrorMessage(error) });
      throw error;
    }
  }
};

function baselineResult(): BedauMetrics & { trajectory: EmergenceTrajectory } {
  return {
    bedau_index: 0,
    emergence_type: 'LINEAR',
    kolmogorov_complexity: 0,
    semantic_entropy: 0,
    confidence_interval: [0, 0],
    effect_size: 0,
    v2_components: {
      phi_fleet_divergence: 0,
      psi_temporal_irreducibility: 0,
      omega_cross_agent_novelty: 0,
      sigma_drift_coherence: 0,
      agent_count: 0,
      receipt_count: 0,
    },
    trajectory: {
      startTime: Date.now(),
      endTime: Date.now(),
      trajectory: [],
      emergenceLevel: 0,
      confidence: 0,
      critical_transitions: [],
    },
  };
}
