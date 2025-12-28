/**
 * Orchestrate Package Exports
 * Enterprise orchestration and integration components
 */

export * from './api-gateway';
export * from './multi-tenant-isolation';
export * from './audit-trails';

// Explicitly re-export to resolve ambiguity
export { 
  ComplianceReport as EnterpriseComplianceReport,
  ComplianceRecommendation as EnterpriseComplianceRecommendation 
} from './enterprise-integration';

export { 
  ComplianceReport as ReportingComplianceReport,
  ComplianceRecommendation as ReportingComplianceRecommendation 
} from './compliance-reporting';

// LVS Agent Orchestration
export * from './lvs-agent-orchestrator';

// Unified Domain Models & Service Layer
export * from './domain-models';
export * from './orchestrate-service';

// Core Types
export { Agent } from './agent-model';

// Enhanced Agent interface with missing properties
export interface EnhancedAgent extends Agent {
  credentials?: any;
  did?: string;
}
export { WorkflowDefinition, WorkflowExecution } from './agent-types-enhanced';

// Enhanced WorkflowStep interface to match usage
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'sequential' | 'parallel' | 'conditional';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  agent_id?: string;
  action: string;
  input?: any;
  output?: any;
  dependencies?: string[];
  timeout?: number;
  retry_count?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Additional missing interfaces
export interface WorkflowTask {
  id: string;
  name: string;
  type: string;
  status: string;
  input?: any;
  output?: any;
}

export interface WorkflowTrigger {
  type: string;
  condition: any;
  action: string;
}

export interface ArticleSnapshot {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Workflow interface
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// Additional missing exports
export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof?: any;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws: string;
}

export interface TacticalDashboard {
  id: string;
  name: string;
  status: string;
  lastUpdated: Date;
  metrics: Record<string, any>;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

// Export createRateLimiter function
export function createRateLimiter(options: { windowMs: number; max: number }) {
  const requests = new Map();
  
  return {
    check: (key: string) => {
      const now = Date.now();
      const windowStart = now - options.windowMs;
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const keyRequests = requests.get(key).filter((time: number) => time > windowStart);
      
      if (keyRequests.length >= options.max) {
        return { allowed: false, remaining: 0 };
      }
      
      keyRequests.push(now);
      requests.set(key, keyRequests);
      
      return { allowed: true, remaining: options.max - keyRequests.length };
    }
  };
}