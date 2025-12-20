/**
 * @sonate/orchestrate - Production Agent Management
 * 
 * SONATE Orchestrate provides enterprise-grade infrastructure for managing
 * AI agents in production with W3C DID/VC, workflow orchestration, and
 * tactical command & control.
 * 
 * HARD BOUNDARY: Production infrastructure only. No experiments.
 */

import { TrustProtocol } from '@sonate/core';

// Core orchestrator
export { AgentOrchestrator } from './agent-orchestrator';

// Components
export { DIDVCManager } from './did-vc-manager';
export { WorkflowEngine } from './workflow-engine';
export { TacticalCommand } from './tactical-command';

// Security & Types
export * from './security';
export { Env, validateCritical } from './security/env-config';
export { createSecretsManager, SecretsManager } from './security/secrets-manager';
export * from './agent-types-enhanced';
export { getLogger, Logger } from './observability/logger';
export * from './observability/metrics';

// Types
export interface Agent {
  id: string;
  name: string;
  did: string;                    // W3C Decentralized Identifier
  credentials: VerifiableCredential[];
  status: 'active' | 'inactive' | 'suspended';
  capabilities: string[];
  metadata: Record<string, any>;
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof: Proof;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  proofValue: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  agent_id: string;
  action: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TacticalDashboard {
  active_agents: number;
  workflows_running: number;
  trust_score_avg: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  agent_id?: string;
}
