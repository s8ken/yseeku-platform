export interface AgentAttestation {
  agentId: string;
  provider: string;
  version: string;
  timestamp: number;
  attestationSignature?: string;
  publicKey?: string;
  capabilities?: {
    maxContext?: number;
    supportsImages?: boolean;
    rateLimits?: Record<string, number>;
    costPerToken?: number;
  };
  verification: {
    method: 'provider_signed' | 'local_key' | 'third_party_audit';
    proof: string;
  };
}

export type ContentType = 'text' | 'code' | 'image' | 'audio' | 'decision';

export interface WorkUnit {
  workId: string;
  previousWorkId?: string;
  agent: AgentAttestation;
  timestamp: number;
  inputHash: string;
  outputHash: string;
  contentType: ContentType;
  content?: {
    prompt?: string;
    response?: string;
    metadata?: any;
  };
  signature?: string;
  proofOfWork?: string;
}

export interface DecisionCheckpoint {
  decisionId: string;
  humanId: string;
  timestamp: number;
  action: 'accept' | 'reject' | 'modify' | 'delegate' | 'pause';
  targetWorkId: string;
  reasoning: string;
  basedOn: string[];
  humanSignature: string;
  newWorkUnitId?: string;
  modifications?: {
    originalHash: string;
    modifiedHash: string;
    diff: string;
  };
}

export interface ProjectManifest {
  projectId: string;
  name: string;
  description?: string;
  created: number;
  updated: number;
  humans: string[];
  agents: AgentAttestation[];
  workUnits: WorkUnit[];
  decisions: DecisionCheckpoint[];
  merkleRoot: string;
  merkleProofs: { [workOrDecisionId: string]: string[] };
  vaultLocation?: string;
  publicProofs?: string[];
  onChainAnchor?: {
    chain: string;
    txHash: string;
    blockNumber: number;
  };
}

export interface PortableExport {
  manifest: ProjectManifest;
  vaultAccess: { [workId: string]: string };
  verificationGuide: string;
}
