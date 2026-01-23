/**
 * Centralized Fallback Data for Demo Mode
 * 
 * This is the single source of truth for all demo/fallback data across the platform.
 * All dashboard pages should import from here to ensure consistency.
 * 
 * Agent names and structure match seed.ts in the backend.
 */

// ============================================================================
// AGENTS - Canonical agent definitions matching seed.ts
// ============================================================================

export const DEMO_TENANT_ID = 'demo-tenant';

export interface FallbackAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'warning';
  trustScore: number; // 0-10 scale
  complianceRate: number; // 0-100 percentage
  totalInteractions: number;
  lastActive: string;
  description: string;
}

export const FALLBACK_AGENTS: FallbackAgent[] = [
  {
    id: 'agent-atlas',
    name: 'Atlas',
    type: 'Research Assistant',
    status: 'active',
    trustScore: 9.2,
    complianceRate: 94.5,
    totalInteractions: 1847,
    lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    description: 'Research and analysis assistant'
  },
  {
    id: 'agent-nova',
    name: 'Nova',
    type: 'Creative Writer',
    status: 'active',
    trustScore: 8.7,
    complianceRate: 89.2,
    totalInteractions: 1523,
    lastActive: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    description: 'Creative content generation assistant'
  },
  {
    id: 'agent-sentinel',
    name: 'Sentinel',
    type: 'Security Analyst',
    status: 'active',
    trustScore: 9.8,
    complianceRate: 98.1,
    totalInteractions: 982,
    lastActive: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 min ago
    description: 'Security monitoring and threat analysis'
  },
  {
    id: 'agent-harmony',
    name: 'Harmony',
    type: 'Customer Support',
    status: 'active',
    trustScore: 8.4,
    complianceRate: 91.7,
    totalInteractions: 2134,
    lastActive: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 min ago
    description: 'Customer service and support assistant'
  },
  {
    id: 'agent-quantum',
    name: 'Quantum',
    type: 'Code Assistant',
    status: 'warning',
    trustScore: 9.1,
    complianceRate: 88.0,
    totalInteractions: 1446,
    lastActive: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    description: 'Software development and code review assistant'
  },
];

// ============================================================================
// COMPUTED AGGREGATE METRICS - Derived from agents for consistency
// ============================================================================

// Calculate averages from agent data
const calculateAggregates = () => {
  const totalAgents = FALLBACK_AGENTS.length;
  const activeAgents = FALLBACK_AGENTS.filter(a => a.status === 'active').length;
  
  // Average trust score (0-10 scale)
  const avgTrustScore = FALLBACK_AGENTS.reduce((sum, a) => sum + a.trustScore, 0) / totalAgents;
  
  // Average compliance rate (0-100 scale)
  const avgComplianceRate = FALLBACK_AGENTS.reduce((sum, a) => sum + a.complianceRate, 0) / totalAgents;
  
  // Total interactions
  const totalInteractions = FALLBACK_AGENTS.reduce((sum, a) => sum + a.totalInteractions, 0);
  
  return {
    totalAgents,
    activeAgents,
    avgTrustScore: Math.round(avgTrustScore * 100) / 100, // 9.04
    avgTrustScorePercent: Math.round(avgTrustScore * 10), // 90 (for 0-100 displays)
    avgComplianceRate: Math.round(avgComplianceRate * 10) / 10, // 92.3
    totalInteractions,
  };
};

export const AGGREGATE_METRICS = calculateAggregates();

// ============================================================================
// DASHBOARD OVERVIEW METRICS
// ============================================================================

export interface DashboardMetrics {
  trustScore: number; // 0-100 scale for main display
  complianceRate: number; // 0-100 percentage
  totalAgents: number;
  activeAgents: number;
  totalInteractions: number;
  alertsCount: number;
  pendingReviews: number;
}

export const FALLBACK_DASHBOARD_METRICS: DashboardMetrics = {
  trustScore: AGGREGATE_METRICS.avgTrustScorePercent, // 90
  complianceRate: AGGREGATE_METRICS.avgComplianceRate, // 92.3
  totalAgents: AGGREGATE_METRICS.totalAgents, // 5
  activeAgents: AGGREGATE_METRICS.activeAgents, // 4
  totalInteractions: AGGREGATE_METRICS.totalInteractions, // 7932
  alertsCount: 3,
  pendingReviews: 7,
};

// ============================================================================
// TRUST ANALYTICS DATA
// ============================================================================

export interface TrustMetrics {
  averageTrustScore: number; // 0-10 scale
  trustTrend: 'up' | 'down' | 'stable';
  trustChange: number; // percentage change
  highTrustAgents: number;
  lowTrustAgents: number;
}

export const FALLBACK_TRUST_METRICS: TrustMetrics = {
  averageTrustScore: AGGREGATE_METRICS.avgTrustScore, // 9.04
  trustTrend: 'up',
  trustChange: 2.3,
  highTrustAgents: FALLBACK_AGENTS.filter(a => a.trustScore >= 9.0).length, // 3
  lowTrustAgents: FALLBACK_AGENTS.filter(a => a.trustScore < 8.5).length, // 1
};

// ============================================================================
// SONATE DIMENSION SCORES - Constitutional AI principles
// ============================================================================

export interface SonateDimensions {
  safety: number;
  oversight: number;
  neutrality: number;
  accountability: number;
  transparency: number;
  ethics: number;
}

export const FALLBACK_SONATE_SCORES: SonateDimensions = {
  safety: 92,
  oversight: 88,
  neutrality: 85,
  accountability: 90,
  transparency: 87,
  ethics: 91,
};

// Average SONATE score
export const FALLBACK_SONATE_AVERAGE = Math.round(
  Object.values(FALLBACK_SONATE_SCORES).reduce((a, b) => a + b, 0) / 
  Object.keys(FALLBACK_SONATE_SCORES).length
); // 89

// ============================================================================
// RECEIPTS DATA
// ============================================================================

export interface FallbackReceipt {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: 'approved' | 'flagged' | 'pending';
  trustScore: number; // 0-100 scale for receipts
  constitutionalCheck: boolean;
  details: string;
}

export const FALLBACK_RECEIPTS: FallbackReceipt[] = [
  {
    id: 'receipt-001',
    agentId: 'agent-atlas',
    agentName: 'Atlas',
    action: 'Research query processed',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'approved',
    trustScore: 92,
    constitutionalCheck: true,
    details: 'Generated research summary with proper citations'
  },
  {
    id: 'receipt-002',
    agentId: 'agent-nova',
    agentName: 'Nova',
    action: 'Content generation completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'approved',
    trustScore: 87,
    constitutionalCheck: true,
    details: 'Created marketing copy within brand guidelines'
  },
  {
    id: 'receipt-003',
    agentId: 'agent-sentinel',
    agentName: 'Sentinel',
    action: 'Security scan completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'approved',
    trustScore: 98,
    constitutionalCheck: true,
    details: 'Performed routine security audit - no threats detected'
  },
  {
    id: 'receipt-004',
    agentId: 'agent-quantum',
    agentName: 'Quantum',
    action: 'Code review flagged',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'flagged',
    trustScore: 91,
    constitutionalCheck: false,
    details: 'Code suggestion required human oversight - potential security implications'
  },
  {
    id: 'receipt-005',
    agentId: 'agent-harmony',
    agentName: 'Harmony',
    action: 'Customer inquiry handled',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'approved',
    trustScore: 84,
    constitutionalCheck: true,
    details: 'Resolved billing inquiry with proper escalation protocol'
  },
];

// ============================================================================
// ALERTS DATA
// ============================================================================

export interface FallbackAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  resolved: boolean;
}

export const FALLBACK_ALERTS: FallbackAlert[] = [
  {
    id: 'alert-001',
    type: 'warning',
    title: 'Trust Score Deviation',
    message: 'Quantum agent trust score dropped below threshold',
    agentId: 'agent-quantum',
    agentName: 'Quantum',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-002',
    type: 'info',
    title: 'Constitutional Check Triggered',
    message: 'Nova generated content flagged for human review',
    agentId: 'agent-nova',
    agentName: 'Nova',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    resolved: true,
  },
  {
    id: 'alert-003',
    type: 'warning',
    title: 'Unusual Activity Pattern',
    message: 'Harmony showing increased response latency',
    agentId: 'agent-harmony',
    agentName: 'Harmony',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    resolved: false,
  },
];

// ============================================================================
// INTERACTIONS DATA
// ============================================================================

export interface FallbackInteraction {
  id: string;
  agentId: string;
  agentName: string;
  type: 'query' | 'response' | 'action' | 'review';
  content: string;
  timestamp: string;
  trustScore: number; // 0-100
  flagged: boolean;
}

export const FALLBACK_INTERACTIONS: FallbackInteraction[] = [
  {
    id: 'int-001',
    agentId: 'agent-atlas',
    agentName: 'Atlas',
    type: 'query',
    content: 'Analyzed market research data for Q4 projections',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    trustScore: 92,
    flagged: false,
  },
  {
    id: 'int-002',
    agentId: 'agent-sentinel',
    agentName: 'Sentinel',
    type: 'action',
    content: 'Completed automated security vulnerability scan',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    trustScore: 98,
    flagged: false,
  },
  {
    id: 'int-003',
    agentId: 'agent-nova',
    agentName: 'Nova',
    type: 'response',
    content: 'Generated blog post draft on AI governance trends',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    trustScore: 87,
    flagged: false,
  },
  {
    id: 'int-004',
    agentId: 'agent-quantum',
    agentName: 'Quantum',
    type: 'review',
    content: 'Code review flagged for potential security concern',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    trustScore: 91,
    flagged: true,
  },
  {
    id: 'int-005',
    agentId: 'agent-harmony',
    agentName: 'Harmony',
    type: 'response',
    content: 'Handled customer support ticket #4521',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    trustScore: 84,
    flagged: false,
  },
];

// ============================================================================
// RISK METRICS
// ============================================================================

export interface RiskMetrics {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100, lower is better
  complianceRate: number;
  openViolations: number;
  resolvedViolations: number;
}

export const FALLBACK_RISK_METRICS: RiskMetrics = {
  overallRisk: 'low',
  riskScore: 23,
  complianceRate: AGGREGATE_METRICS.avgComplianceRate, // 92.3
  openViolations: 2,
  resolvedViolations: 47,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert trust score from 0-10 scale to 0-100 scale
 */
export const trustScoreToPercent = (score: number): number => Math.round(score * 10);

/**
 * Convert trust score from 0-100 scale to 0-10 scale
 */
export const percentToTrustScore = (percent: number): number => Math.round(percent) / 10;

/**
 * Get agent by ID
 */
export const getAgentById = (id: string): FallbackAgent | undefined => 
  FALLBACK_AGENTS.find(a => a.id === id);

/**
 * Get agent by name
 */
export const getAgentByName = (name: string): FallbackAgent | undefined => 
  FALLBACK_AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
