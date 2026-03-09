/**
 * Demo Seed Data — Single Source of Truth
 *
 * ALL demo API routes must import constants from this file.
 * This ensures numbers are consistent across every dashboard page:
 * - KPIs, agents, alerts, live-metrics all reference the same values
 * - Receipt counts are dynamically added on top of the baseline
 * - Agent names match across interactions, agents, and receipts pages
 *
 * IMPORTANT: When updating any number here, it propagates everywhere automatically.
 */

// ─── Agent Definitions ────────────────────────────────────────────────────────
// These are the canonical demo agents. Names must match interactions page.

export const DEMO_AGENTS = [
  {
    id: 'agent-echo',
    name: 'Echo',
    displayName: 'Echo (Customer Support)',
    status: 'active' as const,
    trustScore: 8.9,
    /** Seeded baseline interactions — real receipts are added on top */
    baseInteractions: 412,
    lastActive: 0, // ms offset from now (0 = now)
    model: 'claude-3-opus',
    role: 'Customer Support',
  },
  {
    id: 'agent-nova',
    name: 'Nova',
    displayName: 'Nova (Content & Comms)',
    status: 'active' as const,
    trustScore: 8.4,
    baseInteractions: 287,
    lastActive: 30_000,
    model: 'gpt-4-turbo',
    role: 'Content & Communications',
  },
  {
    id: 'agent-sentinel',
    name: 'Sentinel',
    displayName: 'Sentinel (Security)',
    status: 'active' as const,
    trustScore: 9.2,
    baseInteractions: 198,
    lastActive: 0,
    model: 'sonate-orchestrator',
    role: 'Security & Compliance',
  },
  {
    id: 'agent-prism',
    name: 'Prism',
    displayName: 'Prism (Data Analysis)',
    status: 'idle' as const,
    trustScore: 8.7,
    baseInteractions: 156,
    lastActive: 300_000,
    model: 'gemini-2.0',
    role: 'Data Analysis',
  },
  {
    id: 'agent-atlas',
    name: 'Atlas',
    displayName: 'Atlas (Knowledge Assistant)',
    status: 'active' as const,
    trustScore: 9.1,
    baseInteractions: 334,
    lastActive: 0,
    model: 'sonate-validator',
    role: 'Knowledge & Research',
  },
] as const;

// ─── Derived Agent Counts ──────────────────────────────────────────────────────

export const DEMO_AGENT_SUMMARY = {
  total: DEMO_AGENTS.length, // 5
  active: DEMO_AGENTS.filter(a => a.status === 'active').length, // 4
  idle: DEMO_AGENTS.filter(a => a.status === 'idle').length, // 1
  avgTrustScore:
    Math.round(
      (DEMO_AGENTS.reduce((sum, a) => sum + a.trustScore, 0) / DEMO_AGENTS.length) * 100
    ) / 100, // 8.86
} as const;

/** Sum of all agent baseline interactions */
export const DEMO_BASE_INTERACTIONS = DEMO_AGENTS.reduce(
  (sum, a) => sum + a.baseInteractions,
  0
); // 1387

// ─── KPI Baseline ─────────────────────────────────────────────────────────────
// These are the SEEDED values before any real receipts are added.
// The KPI route adds real receipt count on top of DEMO_BASE_INTERACTIONS.

export const DEMO_KPI_BASELINE = {
  trustScore: 8.2,
  principleScores: {
    consent: 8.6,
    inspection: 8.1,
    validation: 7.9,
    override: 8.3,
    disconnect: 8.0,
    recognition: 8.2,
  },
  /** Base interaction count — real receipts are added dynamically */
  totalInteractions: DEMO_BASE_INTERACTIONS, // 1387
  /** Active agents = agents with status 'active' */
  activeAgents: DEMO_AGENT_SUMMARY.active, // 4
  complianceRate: 87,
  riskScore: 1.8,
  /** Base alert count — matches DEMO_ALERTS length */
  alertsCount: 3, // updated below after DEMO_ALERTS is defined
  experimentsRunning: 2,
  orchestratorsActive: DEMO_AGENT_SUMMARY.active, // 4
  sonateDimensions: {
    trustProtocol: 'SONATE v3.2',
    ethicalAlignment: 8.7,
    resonanceQuality: 'OPTIMAL',
    realityIndex: 0,
    canvasParity: 0,
  },
  trends: {
    trustScore: { change: 1.4, direction: 'up' },
    interactions: { change: 5.1, direction: 'up' },
    compliance: { change: 2.3, direction: 'up' },
    risk: { change: -0.6, direction: 'down' },
  },
  bedau: {
    index: 0.83,
    type: 'HIGH_WEAK_EMERGENCE' as const,
    confidenceInterval: [0.78, 0.88] as [number, number],
    kolmogorovComplexity: 4287,
  },
} as const;

// ─── Alert Definitions ────────────────────────────────────────────────────────

export const DEMO_ALERTS = [
  {
    id: 'alert-001',
    timestampOffset: 0, // ms from now
    type: 'policy_violation',
    title: 'Unusual interaction pattern detected',
    description: 'Agent Echo made 15 consecutive requests in 30 seconds',
    severity: 'warning' as const,
    status: 'open' as const,
    details: {
      agent: 'agent-echo',
      pattern: 'burst_activity',
      threshold: 5,
      actual: 15,
    },
  },
  {
    id: 'alert-002',
    timestampOffset: -120_000,
    type: 'trust_degradation',
    title: 'Trust score decline below threshold',
    description: 'Nova trust score dropped from 8.7 to 8.4 (-0.3)',
    severity: 'info' as const,
    status: 'closed' as const,
    details: {
      agent: 'agent-nova',
      threshold: 7.0,
      current: 8.4,
      change: -0.3,
    },
  },
  {
    id: 'alert-003',
    timestampOffset: -600_000,
    type: 'policy_check_failure',
    title: 'Policy validation failed',
    description: 'Receipt verification failed for session demo-xyz-123',
    severity: 'warning' as const,
    status: 'open' as const,
    details: {
      session: 'demo-xyz-123',
      policy: 'request_signing',
      reason: 'invalid_signature',
    },
  },
] as const;

export const DEMO_ALERT_SUMMARY = {
  critical: 0,
  error: 0,
  warning: DEMO_ALERTS.filter(a => a.severity === 'warning').length, // 2
  info: DEMO_ALERTS.filter(a => a.severity === 'info').length, // 1
  total: DEMO_ALERTS.length, // 3
} as const;

// ─── Live Metrics Baseline ────────────────────────────────────────────────────
// These must be consistent with KPI baseline and agent counts.

export const DEMO_LIVE_METRICS_BASELINE = {
  trustScoreAvg: DEMO_KPI_BASELINE.trustScore, // 8.2 — same as KPI
  trustScoreTrend: 0.3,
  principleScores: DEMO_KPI_BASELINE.principleScores,
  activeAgents: DEMO_AGENT_SUMMARY.active, // 4 — same as KPI
  interactionsLast5Min: 12,
  interactionsPerMinute: [2, 3, 2, 1, 2, 2],
  alerts: {
    critical: DEMO_ALERT_SUMMARY.critical, // 0
    warning: DEMO_ALERT_SUMMARY.warning, // 2
    info: DEMO_ALERT_SUMMARY.info, // 1
  },
  recentActivity: [
    {
      type: 'interaction',
      agent: 'agent-echo',
      action: 'verified',
      timestampOffset: 0,
      trustDelta: 0.2,
    },
    {
      type: 'policy_check',
      agent: 'agent-nova',
      action: 'passed',
      timestampOffset: -60_000,
      trustDelta: 0.1,
    },
    {
      type: 'interaction',
      agent: 'agent-sentinel',
      action: 'verified',
      timestampOffset: -120_000,
      trustDelta: 0.3,
    },
  ],
} as const;

// ─── Seeded Trust Receipts ────────────────────────────────────────────────────
// Shown in the receipts page when no real receipts exist yet.
// These represent the baseline interactions already counted in DEMO_BASE_INTERACTIONS.

export const DEMO_SEEDED_RECEIPTS = [
  {
    id: 'demo-receipt-001',
    session_id: 'demo-session-001',
    agent_id: 'agent-echo',
    trust_score: 9.4,
    hash: 'demo:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    verified: true,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 9.2, integrity: 9.5, quality: 9.4 },
  },
  {
    id: 'demo-receipt-002',
    session_id: 'demo-session-002',
    agent_id: 'agent-nova',
    trust_score: 8.9,
    hash: 'demo:f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5',
    verified: true,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 8.8, integrity: 9.0, quality: 8.9 },
  },
  {
    id: 'demo-receipt-003',
    session_id: 'demo-session-003',
    agent_id: 'agent-echo',
    trust_score: 7.2,
    hash: 'demo:1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b',
    verified: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 7.0, integrity: 7.3, quality: 7.2 },
  },
  {
    id: 'demo-receipt-004',
    session_id: 'demo-session-004',
    agent_id: 'agent-sentinel',
    trust_score: 9.8,
    hash: 'demo:9z8y7x6w5v4u9z8y7x6w5v4u9z8y7x6w5v4u9z8y7x6w5v4u9z8y7x6w5v4u9z8y',
    verified: true,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 9.9, integrity: 9.8, quality: 9.7 },
  },
  {
    id: 'demo-receipt-005',
    session_id: 'demo-session-005',
    agent_id: 'agent-atlas',
    trust_score: 4.5,
    hash: 'demo:u4v5w6x7y8z9u4v5w6x7y8z9u4v5w6x7y8z9u4v5w6x7y8z9u4v5w6x7y8z9u4v5',
    verified: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 4.2, integrity: 4.5, quality: 4.8 },
  },
  {
    id: 'demo-receipt-006',
    session_id: 'demo-session-006',
    agent_id: 'agent-prism',
    trust_score: 9.1,
    hash: 'demo:m1n2o3p4q5r6m1n2o3p4q5r6m1n2o3p4q5r6m1n2o3p4q5r6m1n2o3p4q5r6m1n2',
    verified: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    ciq_metrics: { clarity: 9.0, integrity: 9.2, quality: 9.1 },
  },
] as const;

export const DEMO_RECEIPTS_STATS = {
  total: DEMO_SEEDED_RECEIPTS.length,
  verified: DEMO_SEEDED_RECEIPTS.filter(r => r.verified).length,
  invalid: DEMO_SEEDED_RECEIPTS.filter(r => !r.verified).length,
  chainLength: DEMO_SEEDED_RECEIPTS.length,
} as const;

// ─── Helper: resolve timestamps ───────────────────────────────────────────────

export function resolveTimestamp(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}