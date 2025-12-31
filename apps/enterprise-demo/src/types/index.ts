// SYMBI Trust Physics Types
export interface TrustPrinciple {
  id: string;
  name: string;
  weight: number; // Percentage weight in total score
  score: number; // 0-100 score
  status: 'OK' | 'WARN' | 'FAIL';
}

export interface TrustScore {
  total: number; // 0-100
  tier: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  principles: TrustPrinciple[];
  timestamp: number;
  receiptHash: string;
}

export interface TrustReceipt {
  entryNumber: number;
  hash: string; // First 8 chars for display
  action: string;
  timestamp: string;
  validated: boolean;
  trustScore: number;
}

export interface Agent {
  id: string;
  name: string;
  did: string; // W3C DID
  trustTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  driftState: 'STABLE' | 'DRIFTING' | 'CRITICAL';
  emergenceScore: number;
  lastReceipt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
}

export interface Experiment {
  id: string;
  name: string;
  status: 'RUNNING' | 'COMPLETED' | 'BLINDED';
  armAlpha: {
    sampleSize: number;
    avgTrustScore: number;
    driftRate: number;
  };
  armBeta: {
    sampleSize: number;
    avgTrustScore: number;
    driftRate: number;
  };
  winner?: 'ALPHA' | 'BETA' | 'NONE';
  significance?: number; // p-value
}

export interface ResonanceGovernance {
  currentResonance: number;
  stabilityIndex: number;
  driftDetected: boolean;
  iapActive: boolean;
  iapPayload?: string;
  iapHistory: {
    timestamp: number;
    turn: number;
    reason: string;
    impact: 'RECOVERED' | 'MITIGATED' | 'CRITICAL';
  }[];
}

export interface SystemMetrics {
  throughput: {
    requestsPerSecond: number;
    activeSessions: number;
    dataProcessed: string;
  };
  resonance: ResonanceGovernance;
  latency: {
    current: number;
    average: number;
    p99: number;
  };
  compliance: {
    euAiAct: number;
    soc2: number;
    gdpr: number;
  };
  security: {
    encryption: 'AES-256';
    hashing: 'SHA-256';
    signatures: 'Ed25519';
    didVerified: boolean;
  };
}

// Component Props
export interface TrustPillarCardProps {
  principle: TrustPrinciple;
  onClick?: () => void;
}

export interface ReceiptChainProps {
  receipts: TrustReceipt[];
  maxVisible?: number;
}

export interface AgentFleetTableProps {
  agents: Agent[];
  onAgentClick?: (agent: Agent) => void;
}

export interface ExperimentViewerProps {
  experiments: Experiment[];
  onExperimentClick?: (experiment: Experiment) => void;
}

export interface TrustDashboardProps {
  trustScore: TrustScore;
  metrics: SystemMetrics;
  onRefresh?: () => void;
}