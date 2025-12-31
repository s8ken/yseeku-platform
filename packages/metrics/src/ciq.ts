// Integer CIQ: 1000 basis points precision (Solana-grade)
// Guarantees reproducibility across Node versions
export interface CIQSubmetrics {
  clarity: number;    // 0.0-1.0
  integrity: number;  // 0.0-1.0 
  quality: number;    // 0.0-1.0
}

export function computeCIQ(metrics: CIQSubmetrics): number {
  // Scale to basis points (0.001 precision) → integer math
  const c = BigInt(Math.round(metrics.clarity * 1000));
  const i = BigInt(Math.round(metrics.integrity * 1000));
  const q = BigInt(Math.round(metrics.quality * 1000));
  
  // Weighted sum (30/30/40) → multiply weights FIRST
  const weighted = c * 300n + i * 300n + q * 400n;
  
  // Final division → guaranteed deterministic
  // Since we multiplied by 1000 (basis points) and weights sum to 1000, 
  // the result is in basis points.
  return Number(weighted / 1000n);
}

export function ciqUplift(
  baseline: number,
  symbi: number
): number {
  if (baseline === 0) return 0;
  const b = BigInt(baseline);
  const s = BigInt(symbi);
  // (s - b) * 100 / b with rounding
  return Number(((s - b) * 100n + b / 2n) / b);
}

// Export for replication kit
export const WEIGHTS = { clarity: 0.3, integrity: 0.3, quality: 0.4 } as const;
