
import { Agent, IAgent } from '../models/agent.model';
import { llmService } from './llm.service';
import logger from '../utils/logger';
import { BrainCycle } from '../models/brain-cycle.model';
import { gatherSensors } from './brain/sensors';
import { analyzeContext } from './brain/analyzer';
import { planActions } from './brain/planner';
import { executeActions } from './brain/executor';
import { brainCyclesTotal, brainCycleDurationSeconds } from '../observability/metrics';
import { measureActionImpact, getActionRecommendations, getLatestRecommendations, SystemState } from './brain/feedback';
import { recall } from './brain/memory';

export class SystemBrainService {
  private static instance: SystemBrainService;
  private brainAgentId: string | null = null;
  private isThinking: boolean = false;
  private lastRecommendationUpdate: Date | null = null;

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
      model: 'claude-opus-4-20250514',
      apiKeyId: ownerId, // Use user's key (LLMService will fallback to user keys if this ID matches user)
      systemPrompt: `You are the Overseer of the YSEEKU Platform.
Your goal is to monitor system health, trust metrics, and emergence patterns.
You have access to:
1. Trust Receipts (recent stream)
2. Bedau Index (emergence status)
3. System Logs
4. Action Effectiveness Feedback

Your output should be structured JSON indicating:
- status: 'healthy' | 'warning' | 'critical'
- observations: string[]
- actions: { type: 'alert' | 'ban_agent' | 'restrict_agent' | 'quarantine_agent' | 'unban_agent' | 'adjust_threshold', target: string, reason: string, severity?: string }[]

Consider past action effectiveness when planning new actions.`,
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

      // 1. Gather current system state (pre-action)
      const sensors = await gatherSensors(tenantId);
      const preActionState: SystemState = {
        avgTrust: sensors.avgTrust,
        emergenceLevel: sensors.bedau?.emergence_type || 'LINEAR',
      };

      // 2. Analyze context
      const analysis = analyzeContext({
        bedau: sensors.bedau,
        avgTrust: sensors.avgTrust,
        receipts: sensors.receipts
      });

      // 3. Plan actions (could be enhanced with recommendation awareness)
      const planned = planActions(analysis);

      // 4. Create cycle record
      const cycle = await BrainCycle.create({
        tenantId,
        status: 'started',
        observations: analysis.observations,
        actions: planned.map(a => ({ type: a.type, target: a.target, reason: a.reason, status: 'planned' })),
        inputContext: { bedau: sensors.bedau, avgTrust: sensors.avgTrust },
        startedAt: new Date()
      });

      // 5. Get LLM analysis
      const brainAgent = await Agent.findById(this.brainAgentId);
      if (!brainAgent) throw new Error('Brain agent not found');

      // Include recommendations in the analysis context if available
      const recommendations = await getLatestRecommendations(tenantId);
      const contextForLLM = {
        bedau: sensors.bedau,
        avgTrust: sensors.avgTrust,
        recommendations: recommendations?.adjustments || [],
      };

      const response = await llmService.generate({
        provider: brainAgent.provider,
        model: brainAgent.model,
        messages: [
          { role: 'system', content: brainAgent.systemPrompt },
          { role: 'user', content: `Analyze current system state:\n${JSON.stringify(contextForLLM)}` }
        ],
        temperature: brainAgent.temperature,
        userId: brainAgent.user.toString()
      });

      // 6. Execute actions
      const execResults = await executeActions(tenantId, cycle._id.toString(), planned, mode);

      // 7. Measure action impact (for enforced mode with executed actions)
      if (mode === 'enforced' && execResults.length > 0) {
        // Wait a brief moment for system to stabilize, then measure impact
        await this.measureAndRecordImpact(tenantId, execResults, preActionState);

        // Update recommendations periodically (every hour)
        await this.maybeUpdateRecommendations(tenantId);
      }

      // 8. Complete the cycle
      const durationSeconds = (Date.now() - start) / 1000;
      await BrainCycle.findByIdAndUpdate(cycle._id, {
        status: 'completed',
        llmOutput: response.content,
        metrics: { durationMs: durationSeconds * 1000 },
        completedAt: new Date()
      });

      brainCyclesTotal.inc({ status: 'completed' });
      brainCycleDurationSeconds.observe(durationSeconds);

      logger.info('Brain thinking cycle completed', {
        tenantId,
        mode,
        actionsPlanned: planned.length,
        actionsExecuted: execResults.filter(r => r.status === 'executed').length,
        durationMs: durationSeconds * 1000,
      });

    } catch (error: any) {
      logger.error('System Brain thinking error', { error: error.message });
      brainCyclesTotal.inc({ status: 'failed' });
    } finally {
      this.isThinking = false;
    }
  }

  /**
   * Measure and record the impact of executed actions
   */
  private async measureAndRecordImpact(
    tenantId: string,
    execResults: Array<{ id: string; status: string }>,
    preActionState: SystemState
  ): Promise<void> {
    try {
      // Re-gather sensors to get post-action state
      const postSensors = await gatherSensors(tenantId);
      const postActionState: SystemState = {
        avgTrust: postSensors.avgTrust,
        emergenceLevel: postSensors.bedau?.emergence_type || 'LINEAR',
      };

      // Measure impact for each executed action
      for (const result of execResults) {
        if (result.status === 'executed') {
          try {
            await measureActionImpact(tenantId, result.id, preActionState, postActionState);
          } catch (impactError: any) {
            logger.warn('Failed to measure action impact', {
              actionId: result.id,
              error: impactError.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.warn('Failed to measure action impacts', { error: error.message });
    }
  }

  /**
   * Update action recommendations periodically
   */
  private async maybeUpdateRecommendations(tenantId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (!this.lastRecommendationUpdate || this.lastRecommendationUpdate < oneHourAgo) {
      try {
        await getActionRecommendations(tenantId);
        this.lastRecommendationUpdate = new Date();
        logger.info('Action recommendations updated', { tenantId });
      } catch (error: any) {
        logger.warn('Failed to update recommendations', { error: error.message });
      }
    }
  }

  /**
   * Get the current brain agent ID
   */
  getBrainAgentId(): string | null {
    return this.brainAgentId;
  }

  /**
   * Check if the brain is currently thinking
   */
  isCurrentlyThinking(): boolean {
    return this.isThinking;
  }
}

export const systemBrain = SystemBrainService.getInstance();
