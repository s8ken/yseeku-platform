# @sonate/orchestrate

Production agent management and orchestration for the SONATE platform.

## Overview

SONATE Orchestrate provides enterprise-grade infrastructure for managing AI agents in production. Features W3C DID/VC for identity, workflow orchestration, and real-time tactical command & control.

## HARD BOUNDARY

**SONATE Orchestrate = Production Infrastructure Only**

- ✅ Agent registry with DID/VC (W3C standards)
- ✅ Multi-agent workflow orchestration
- ✅ Tactical Command dashboard (real-time monitoring)
- ✅ RBAC, API keys, audit logging
- ✅ Kubernetes/Docker deployment
- ❌ NO experiments (use `@sonate/lab`)
- ❌ NO research workflows (use `@sonate/lab`)

## Key Features

### W3C DID/VC Compliance
Cryptographic proof of agent identities and capabilities.

### Workflow Orchestration
Sequential and parallel execution of multi-agent workflows.

### Tactical Command
Real-time dashboard with agent status, alerts, and trust scores.

### Enterprise Security
RBAC, audit trails, API key management, rate limiting.

## Installation

```bash
npm install @sonate/orchestrate
```

## Usage

### Register Agents

```typescript
import { AgentOrchestrator } from '@sonate/orchestrate';

const orchestrator = new AgentOrchestrator();

// Register agent with capabilities
const agent = await orchestrator.registerAgent({
  id: 'agent-001',
  name: 'Customer Support AI',
  capabilities: ['chat', 'analyze_sentiment', 'escalate'],
  metadata: {
    model: 'gpt-4',
    region: 'us-east-1',
  },
});

console.log(agent.did); // did:key:z6Mk...
console.log(agent.credentials); // Verifiable Credentials for capabilities
```

### Execute Workflows

```typescript
// Define workflow
const workflow = {
  id: 'wf-001',
  name: 'Customer Inquiry Handling',
  description: 'Handle customer inquiry with AI agents',
  steps: [
    {
      id: 'step-1',
      agent_id: 'agent-001',
      action: 'analyze_inquiry',
      input: {
        message: 'How do I reset my password?',
      },
    },
    {
      id: 'step-2',
      agent_id: 'agent-002',
      action: 'generate_response',
      input: {
        sentiment: 'neutral',
        intent: 'password_reset',
      },
    },
  ],
  status: 'pending',
};

// Execute
const result = await orchestrator.executeWorkflow(workflow);
console.log(result.status); // 'completed'
```

### Monitor with Tactical Command

```typescript
// Get real-time dashboard
const dashboard = await orchestrator.getDashboard();

console.log(dashboard);
/*
{
  active_agents: 12,
  workflows_running: 5,
  trust_score_avg: 8.3,
  alerts: [
    {
      id: 'alert_123',
      severity: 'medium',
      message: 'Agent agent-005 trust score below threshold: 6.8',
      timestamp: 1704123456789,
      agent_id: 'agent-005',
    }
  ]
}
*/
```

### Suspend Agent

```typescript
// Suspend agent (stops all workflows)
await orchestrator.suspendAgent('agent-003');

// Agent status is now 'suspended'
const agent = orchestrator.getAgent('agent-003');
console.log(agent.status); // 'suspended'
```

## W3C DID/VC Integration

### Verify Agent Credentials

```typescript
import { DIDVCManager } from '@sonate/orchestrate';

const didManager = new DIDVCManager();

// Verify credential
const isValid = await didManager.verifyCredential(agent.credentials[0]);
console.log(isValid); // true

// Revoke credential
await didManager.revokeCredential(credential.id);
```

### Create Custom Credentials

```typescript
const did = await didManager.createDID('agent-new');
const credentials = await didManager.issueCredentials(did, [
  'chat',
  'code_generation',
  'data_analysis',
]);
```

## Use Cases

### 1. Multi-Agent Customer Support

Orchestrate multiple specialized agents (triage, response, escalation).

### 2. Production AI Fleet Management

Manage 100+ agents with DID/VC, monitoring, and control.

### 3. Workflow Automation

Chain agents for complex multi-step tasks (research → analysis → report).

### 4. Enterprise Compliance

Audit trails, trust scoring, and RBAC for regulated industries.

## Integration with Other Modules

### Feed Trust Scores from Detect

```typescript
import { SymbiFrameworkDetector } from '@sonate/detect';
import { AgentOrchestrator } from '@sonate/orchestrate';

const detector = new SymbiFrameworkDetector();
const orchestrator = new AgentOrchestrator();

// Monitor agent interactions
const interaction = await captureAgentInteraction();
const detection = await detector.detect(interaction);

// Update tactical dashboard
if (detection.trust_protocol === 'FAIL') {
  orchestrator.tacticalCommand.createAlert({
    severity: 'critical',
    message: `Agent ${agentId} failed trust protocol`,
    agent_id: agentId,
  });
}
```

## API Reference

### AgentOrchestrator
- `registerAgent(agent): Promise<Agent>`
- `executeWorkflow(workflow): Promise<Workflow>`
- `getAgent(agentId): Agent | undefined`
- `listAgents(): Agent[]`
- `suspendAgent(agentId): Promise<void>`
- `getDashboard(): Promise<TacticalDashboard>`

### DIDVCManager
- `createDID(agentId): Promise<string>`
- `issueCredentials(did, capabilities): Promise<VerifiableCredential[]>`
- `verifyCredential(credential): Promise<boolean>`
- `revokeCredential(credentialId): Promise<void>`

### WorkflowEngine
- `execute(workflow): Promise<Workflow>`
- `stopAgentWorkflows(agentId): Promise<void>`
- `getActiveWorkflows(): Workflow[]`

### TacticalCommand
- `getDashboard(agents): Promise<TacticalDashboard>`
- `createAlert(alert): void`
- `monitorTrustScore(agentId, score): Promise<void>`
- `getAlertsBySeverity(severity): Alert[]`

## Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonate-orchestrate
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sonate-orchestrate
  template:
    metadata:
      labels:
        app: sonate-orchestrate
    spec:
      containers:
      - name: orchestrate
        image: yseeku/sonate-orchestrate:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
```

## Performance

- **Throughput**: 1000+ workflows/minute
- **Latency**: < 50ms per workflow step
- **Scalability**: Horizontal (Kubernetes pods)

## License

MIT
