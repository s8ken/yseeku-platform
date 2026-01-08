
import { Agent, IAgent } from '../models/agent.model';
import { llmService } from './llm.service';
import logger from '../utils/logger';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { bedauService } from './bedau.service';

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
  async initialize(tenantId: string): Promise<IAgent> {
    const existingBrain = await Agent.findOne({
      'metadata.role': 'system-brain',
      ciModel: 'system-brain'
    });

    if (existingBrain) {
      this.brainAgentId = existingBrain._id.toString();
      return existingBrain;
    }

    // Create new Brain Agent
    const brain = await Agent.create({
      name: 'YSEEKU Overseer',
      description: 'Autonomous System Governance Agent',
      // Assuming a system user ID exists or passing one
      user: '000000000000000000000000', // Placeholder system user ID
      provider: 'anthropic', // Anthropic is good for system logic
      model: 'claude-3-opus-20240229',
      apiKeyId: '000000000000000000000000', // Placeholder
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
  async think(tenantId: string) {
    if (this.isThinking || !this.brainAgentId) return;
    this.isThinking = true;

    try {
      logger.info('🧠 System Brain: Starting thinking cycle...');

      // 1. Gather Context
      const metrics = await bedauService.getMetrics(tenantId);
      const recentReceipts = await TrustReceiptModel.find({ tenant_id: tenantId })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('ciq_metrics self_hash timestamp')
        .lean();

      // 2. Formulate Prompt
      const context = JSON.stringify({
        bedau_index: metrics.bedau_index,
        emergence_class: metrics.emergence_type,
        recent_trust_scores: recentReceipts.map(r => r.ciq_metrics),
        timestamp: new Date().toISOString()
      });

      const brainAgent = await Agent.findById(this.brainAgentId);
      if (!brainAgent) throw new Error('Brain agent not found');

      // 3. Query LLM
      const response = await llmService.generate({
        provider: brainAgent.provider,
        model: brainAgent.model,
        messages: [
          { role: 'system', content: brainAgent.systemPrompt },
          { role: 'user', content: `Analyze current system state:\n${context}` }
        ],
        temperature: brainAgent.temperature
      });

      // 4. Act on Output
      logger.info('🧠 System Brain Thought:', { content: response.content });
      
      // In a real implementation, we would parse the JSON here and execute actions
      // e.g. if (actions.includes('ban_agent')) ...

    } catch (error: any) {
      logger.error('System Brain thinking error', { error: error.message });
    } finally {
      this.isThinking = false;
    }
  }
}

export const systemBrain = SystemBrainService.getInstance();
