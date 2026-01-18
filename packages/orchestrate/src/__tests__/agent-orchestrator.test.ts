import { AgentOrchestrator } from '../agent-orchestrator';
import { Agent, Workflow } from '../index';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  test('should register an agent', async () => {
    const agentInput = {
      id: 'agent-1',
      name: 'Test Agent',
      capabilities: ['trust-detection'],
      metadata: {},
    };

    const registeredAgent = await orchestrator.registerAgent(agentInput);

    expect(registeredAgent.id).toBe('agent-1');
    expect(registeredAgent.name).toBe('Test Agent');
    expect(registeredAgent.did).toBeDefined();
    expect(registeredAgent.credentials).toBeDefined();
    expect(registeredAgent.status).toBe('active');
  });

  test('should get agent by ID', async () => {
    const agentInput = {
      id: 'agent-2',
      name: 'Test Agent 2',
      capabilities: ['analysis'],
      metadata: {},
    };

    await orchestrator.registerAgent(agentInput);
    const retrieved = orchestrator.getAgent('agent-2');

    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('agent-2');
  });

  test('should list all agents', async () => {
    const agent1 = {
      id: 'agent-3',
      name: 'Agent 3',
      capabilities: ['task1'],
      metadata: {},
    };

    const agent2 = {
      id: 'agent-4',
      name: 'Agent 4',
      capabilities: ['task2'],
      metadata: {},
    };

    await orchestrator.registerAgent(agent1);
    await orchestrator.registerAgent(agent2);

    const agents = orchestrator.listAgents();
    expect(agents.length).toBe(2);
  });

  test('should suspend agent', async () => {
    const agentInput = {
      id: 'agent-5',
      name: 'Suspend Test',
      capabilities: ['test'],
      metadata: {},
    };

    await orchestrator.registerAgent(agentInput);
    await orchestrator.suspendAgent('agent-5');

    const agent = orchestrator.getAgent('agent-5');
    expect(agent!.status).toBe('suspended');
  });

  test('should throw error for unknown agent suspension', async () => {
    await expect(orchestrator.suspendAgent('unknown')).rejects.toThrow('Agent unknown not found');
  });
});
