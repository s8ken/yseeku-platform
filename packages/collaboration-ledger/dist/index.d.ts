import type { AgentAttestation, WorkUnit, DecisionCheckpoint, ProjectManifest, PortableExport } from './types';
export declare class SonateCollaborationLedger {
    private projectId;
    private workUnits;
    private decisions;
    private agents;
    private merkleTree?;
    constructor(projectId: string);
    registerAgent(attestation: AgentAttestation): string;
    logWorkUnit(agentId: string, input: string, output: string, metadata?: any): WorkUnit;
    logDecision(humanId: string, humanSignature: string, action: DecisionCheckpoint['action'], targetWorkId: string, reasoning: string, basedOn: string[], modifications?: DecisionCheckpoint['modifications']): DecisionCheckpoint;
    generateManifest(): ProjectManifest;
    verifyWorkUnit(workId: string): boolean;
    exportToPortable(): PortableExport;
    private hash;
    private updateMerkleTree;
    private verifyHumanSignature;
    private generateProofs;
    private generateVaultAccessToken;
    private generateVerificationGuide;
    private generateAgentId;
}
export declare function writeSonateFile(path: string, manifest: ProjectManifest): void;
export type { AgentAttestation, WorkUnit, DecisionCheckpoint, ProjectManifest };
