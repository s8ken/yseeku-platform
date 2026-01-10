
import { Agent, IAgent } from '../models/agent.model';
import { llmService } from './llm.service';
import logger from '../utils/logger';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { bedauService } from './bedau.service';
import { BrainCycle } from '../models/brain-cycle.model';
import { gatherSensors } from './brain/sensors';
import { analyzeContext } from './brain/analyzer';
import { planActions } from './brain/planner';
import { executeActions } from './brain/executor';
import { brainCyclesTotal, brainCycleDurationSeconds } from '../observability/metrics';

export class SystemBrainService {
  private static instance: SystemBrainService;
  private brainAgentId: string | null = null;
  private isThinking: boolean = false;

  private constructor() {}

  static getInstance(): SystemBrainService {
    if (!SystemBrainService.instance) {
      SystemBrainService.instance = new SystemBrainService();
    }
    return SystemBrainService.instance;
  }

  /**
   * Initialize or retrieve the System Brain agent
   */
  async initialize(tenantId: string, userId?: string): Promise<IAgent> {
    const existingBrain = await Agent.findOne({
      'metadata.role': 'system-brain',
      ciModel: 'system-brain'
    });

    if (existingBrain) {
      this.brainAgentId = existingBrain._id.toString();
      return existingBrain;
    }

    // Use provided userId or fallback to a placeholder (though system should always provide one)
    const ownerId = userId || '000000000000000000000000';

    // Create new Brain Agent
    const brain = await Agent.create({
      name: 'YSEEKU Overseer',
      description: 'Autonomous System Governance Agent',
      user: ownerId, 
      provider: 'anthropic', // Anthropic is good for system logic
      model: 'claude-3-opus-20240229',
      apiKeyId: ownerId, // Use user's key (LLMService will fallback to user keys if this ID matches user)
      systemPrompt: `You are the Overseer of the YSEEKU Platform.
Your goal is to monitor system health, trust metrics, and emergence patterns.
You have access to:
1. Trust Receipts (recent stream)
2. Bedau Index (emergence status)
3. System Logs

Your output should be structured JSON indicating:
- status: 'healthy' | 'warning' | 'critical'
- observations: string[]
- actions: { type: 'alert' | 'ban_agent' | 'adjust_threshold', target: string, reason: string }[]`,
      temperature: 0.1, // High precision
      ciModel: 'system-brain',
      metadata: {
        role: 'system-brain',
        permissions: ['read_logs', 'manage_agents', 'system_alert']
      }
    });

    this.brainAgentId = brain._id.toString();
    logger.info('System Brain Agent initialized', { agentId: this.brainAgentId });
    return brain;
  }

  /**
   * Run a "Thinking Cycle" - The Brain reviews the system state
   */
  async think(tenantId: string, mode: 'advisory' | 'enforced' = 'advisory') {
    if (this.isThinking || !this.brainAgentId) return;
    this.isThinking = true;

    try {
      const start = Date.now();
      const sensors = await gatherSensors(tenantId);
      const analysis = analyzeContext({ bedau: sensors.bedau, avgTrust: sensors.avgTrust, receipts: sensors.receipts });
      const planned = planActions(analysis);
      const cycle = await BrainCycle.create({
        tenantId,
        status: 'started',
        observations: analysis.observations,
        actions: planned.map(a => ({ type: a.type, target: a.target, reason: a.reason, status: 'planned' })),
        inputContext: { bedau: sensors.bedau, avgTrust: sensors.avgTrust },
        startedAt: new Date()
      });

      const brainAgent = await Agent.findById(this.brainAgentId);
      if (!brainAgent) throw new Error('Brain agent not found');

      const response = await llmService.generate({
        provider: brainAgent.provider,
        model: brainAgent.model,
        messages: [
          { role: 'system', content: brainAgent.systemPrompt },
          { role: 'user', content: `Analyze current system state:\n${JSON.stringify({ bedau: sensors.bedau, avgTrust: sensors.avgTrust })}` }
        ],
        temperature: brainAgent.temperature,
        userId: brainAgent.user.toString() // Use agent owner's key
      });
      const execResults = await executeActions(tenantId, cycle._id.toString(), planned, mode);
      const durationSeconds = (Date.now() - start) / 1000;
      await BrainCycle.findByIdAndUpdate(cycle._id, {
        status: 'completed',
        llmOutput: response.content,
        metrics: { durationMs: durationSeconds * 1000 },
        completedAt: new Date()
      });
      brainCyclesTotal.inc({ status: 'completed' });
      brainCycleDurationSeconds.observe(durationSeconds);

    } catch (error: any) {
      logger.error('System Brain thinking error', { error: error.message });
      brainCyclesTotal.inc({ status: 'failed' });
    } finally {
      this.isThinking = false;
    }
  }
}

export const systemBrain = SystemBrainService.getInstance();
