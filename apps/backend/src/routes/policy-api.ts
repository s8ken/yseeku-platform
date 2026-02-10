/**
 * Policy API Service
 * 
 * Express.js service for policy evaluation endpoints
 * Integrates PolicyEngine with HTTP API layer
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { TrustReceipt } from '@sonate/schemas';
import {
  PolicyEngine,
  PolicyRegistry,
  symbiRules,
  symbiPrinciples,
  type PolicyEvaluationResult,
} from '@sonate/policy';
import {
  TruthDebtCalculator,
  CoherenceTracker,
  ResonanceMonitor,
  type TruthDebtAnalysis,
  type CoherenceAnalysis,
  type ResonanceMeasure,
} from '@sonate/monitoring';
import type { PolicyAuditLogger } from './policy-audit-logger';
import type { PolicyAlertService } from './policy-alerts';

/**
 * API Response Types
 */
export interface PolicyEvaluationResponse {
  success: boolean;
  data?: PolicyEvaluationResult;
  metrics?: {
    truthDebt: number;
    coherence: number;
    resonance: number;
  };
  error?: string;
  timestamp: string;
}

export interface MetricsResponse {
  agentDid: string;
  truthDebt?: TruthDebtAnalysis;
  coherence?: CoherenceAnalysis;
  resonance?: ResonanceMeasure;
  timestamp: string;
}

/**
 * Policy API Service
 */
export class PolicyAPIService {
  private router: Router;
  private engine: PolicyEngine;
  private registry: PolicyRegistry;
  private truthDebtCalculator: TruthDebtCalculator;
  private coherenceTracker: CoherenceTracker;
  private resonanceMonitor: ResonanceMonitor;
  private auditLogger?: PolicyAuditLogger;
  private alertService?: PolicyAlertService;

  constructor(auditLogger?: PolicyAuditLogger, alertService?: PolicyAlertService) {
    this.router = Router();
    this.registry = new PolicyRegistry();
    this.engine = new PolicyEngine(this.registry);
    this.truthDebtCalculator = new TruthDebtCalculator();
    this.coherenceTracker = new CoherenceTracker();
    this.resonanceMonitor = new ResonanceMonitor();
    this.auditLogger = auditLogger;
    this.alertService = alertService;

    this.initializeRegistry();
    this.setupRoutes();
  }

  /**
   * Initialize registry with SYMBI rules and principles
   */
  private initializeRegistry(): void {
    this.registry.registerRules(symbiRules);
    this.registry.registerPrinciples(symbiPrinciples);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Policy Evaluation
    this.router.post('/evaluate', this.evaluatePolicy.bind(this));
    this.router.post('/evaluate/batch', this.evaluateBatch.bind(this));
    this.router.post('/check-block', this.checkBlock.bind(this));

    // Metrics
    this.router.post('/metrics/analyze', this.analyzeMetrics.bind(this));
    this.router.get('/metrics/:agentDid', this.getAgentMetrics.bind(this));
    this.router.get('/metrics/:agentDid/history', this.getAgentHistory.bind(this));

    // Registry
    this.router.get('/rules', this.listRules.bind(this));
    this.router.get('/principles', this.listPrinciples.bind(this));
    this.router.get('/rules/:ruleId', this.getRule.bind(this));

    // Health & Stats
    this.router.get('/health', this.getHealth.bind(this));
    this.router.get('/stats', this.getStats.bind(this));
  }

  /**
   * POST /policy/evaluate
   * Evaluate single receipt against policies
   */
  private async evaluatePolicy(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { receipt, principleIds } = req.body;

      if (!receipt) {
        res.status(400).json({
          success: false,
          error: 'Missing receipt in request body',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Evaluate policy
      const evaluation = this.engine.evaluate(receipt as TrustReceipt, principleIds);

      // Calculate metrics
      const truthDebt = this.truthDebtCalculator.calculateTruthDebt(
        receipt.interaction?.response || ''
      );

      // Record for coherence tracking
      this.coherenceTracker.recordInteraction(receipt as TrustReceipt);
      const coherence = this.coherenceTracker.calculateLBC(receipt.agent_did, 10);

      // Measure resonance
      const resonance = this.resonanceMonitor.measureResonance(receipt as TrustReceipt);

      // Log to audit trail
      if (this.auditLogger) {
        this.auditLogger.logEvaluation(
          receipt as TrustReceipt,
          evaluation,
          principleIds || [],
          {
            truthDebt,
            coherence: coherence.lbcScore,
            resonance: resonance.resonanceScore,
          }
        );
      }

      // Process alerts
      if (this.alertService) {
        await this.alertService.processReceipt(receipt as TrustReceipt, principleIds);
      }

      res.json({
        success: evaluation.passed,
        data: evaluation,
        metrics: {
          truthDebt: truthDebt,
          coherence: coherence.lbcScore,
          resonance: resonance.resonanceScore,
        },
        timestamp: new Date().toISOString(),
      } as PolicyEvaluationResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /policy/evaluate/batch
   * Evaluate multiple receipts
   */
  private async evaluateBatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { receipts, principleIds } = req.body;

      if (!Array.isArray(receipts)) {
        res.status(400).json({
          success: false,
          error: 'receipts must be an array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const batchResult = this.engine.evaluateBatch(receipts as TrustReceipt[], principleIds);

      res.json({
        success: true,
        data: {
          total: batchResult.total,
          passed: batchResult.passed,
          failed: batchResult.failed,
          violations: Array.from(batchResult.violations.entries()),
          evaluationTimeMs: batchResult.evaluationTimeMs,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /policy/check-block
   * Quick check if receipt should be blocked
   */
  private async checkBlock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { receipt, principleIds } = req.body;

      if (!receipt) {
        res.status(400).json({
          success: false,
          error: 'Missing receipt',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const shouldBlock = this.engine.shouldBlock(receipt as TrustReceipt, principleIds);
      const report = this.engine.getViolationReport(receipt as TrustReceipt, principleIds);

      res.json({
        success: true,
        data: {
          blocked: shouldBlock,
          violations: {
            critical: report.criticalCount,
            high: report.highCount,
            medium: report.mediumCount,
            low: report.lowCount,
          },
          summary: (report as any).violations?.size > 0 
            ? (Array.from((report as any).violations.values())[0] as any)?.ruleId
            : undefined,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /policy/metrics/analyze
   * Analyze receipt metrics
   */
  private async analyzeMetrics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { receipt } = req.body;

      if (!receipt) {
        res.status(400).json({
          success: false,
          error: 'Missing receipt',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const truthDebt = this.truthDebtCalculator.analyzeReceipt(receipt as TrustReceipt);
      const resonance = this.resonanceMonitor.measureResonance(receipt as TrustReceipt);

      // Record and get coherence
      this.coherenceTracker.recordInteraction(receipt as TrustReceipt);
      const coherence = this.coherenceTracker.calculateLBC(receipt.agent_did, 10);

      res.json({
        success: true,
        data: {
          agentDid: receipt.agent_did,
          truthDebt,
          coherence,
          resonance,
        } as MetricsResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/metrics/:agentDid
   * Get current metrics for agent
   */
  private async getAgentMetrics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { agentDid } = req.params;

    const coherence = this.coherenceTracker.calculateLBC(agentDid as string, 50);
    const aggregated = this.resonanceMonitor.getAggregatedMetrics(agentDid as string);

    res.json({
        success: true,
        data: {
          agentDid,
          coherence,
          resonance: aggregated,
          lastUpdated: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/metrics/:agentDid/history
   * Get interaction history for agent
   */
  private async getAgentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { agentDid } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const history = this.coherenceTracker.getHistory(agentDid as string);
    const recent = history.slice(Math.max(0, history.length - limit));

      res.json({
        success: true,
        data: {
          agentDid,
          total: history.length,
          returned: recent.length,
          history: recent,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/rules
   * List all available rules
   */
  private async listRules(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rules = this.registry.getAllRules();

      res.json({
        success: true,
        data: {
          total: rules.length,
          rules: rules.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            severity: r.severity,
            enabled: r.enabled,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/principles
   * List all principles
   */
  private async listPrinciples(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const principles = this.registry.getAllPrinciples();

      res.json({
        success: true,
        data: {
          total: principles.length,
          principles: principles.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            ruleCount: p.rules.length,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/rules/:ruleId
   * Get specific rule details
   */
  private async getRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ruleId } = req.params;
      const rule = this.registry.getRule(ruleId as string);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: `Rule ${ruleId} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          enabled: rule.enabled,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/health
   * Health check
   */
  private async getHealth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = this.engine.getStats();
      const registryStats = this.registry.getStats();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          components: {
            policyEngine: { status: 'active', evaluations: stats.totalEvaluations },
            registry: { status: 'active', rules: registryStats.totalRules },
            metrics: { status: 'active' },
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /policy/stats
   * Get detailed statistics
   */
  private async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const engineStats = this.engine.getStats();
      const registryStats = this.registry.getStats();

      res.json({
        success: true,
        data: {
          engine: engineStats,
          registry: registryStats,
          agents: {
            tracked: this.coherenceTracker.getTrackedAgents().length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get router for mounting
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get engine for direct access
   */
  getEngine(): PolicyEngine {
    return this.engine;
  }
}

/**
 * Factory function to create API service
 */
export function createPolicyAPIService(
  auditLogger?: PolicyAuditLogger,
  alertService?: PolicyAlertService
): PolicyAPIService {
  return new PolicyAPIService(auditLogger, alertService);
}
