/**
 * Custom Policy Service
 * 
 * Manages tenant-specific policy rules:
 * - CRUD operations for custom rules
 * - Rule evaluation against interactions
 * - Integration with base policy engine
 */

import { 
  CustomPolicyRuleModel, 
  CustomPolicyRule, 
  RuleCondition,
  RuleSeverity 
} from '../models/custom-policy.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';
import crypto from 'crypto';

export interface EvaluationContext {
  prompt: string;
  response: string;
  metadata?: Record<string, any>;
}

export interface RuleViolation {
  rule_id: string;
  name: string;
  severity: RuleSeverity;
  action: 'block' | 'warn' | 'log';
  message: string;
  matchedConditions: string[];
}

export interface EvaluationResult {
  passed: boolean;
  violations: RuleViolation[];
  evaluatedRules: number;
  evaluationTimeMs: number;
  shouldBlock: boolean;
}

class CustomPolicyService {
  /**
   * Create a new custom policy rule
   */
  async createRule(
    tenantId: string,
    rule: Omit<CustomPolicyRule, 'tenant_id' | 'rule_id' | 'version' | 'created_by' | 'updated_by'>,
    createdBy: string
  ): Promise<CustomPolicyRule> {
    try {
      const ruleId = `rule_${crypto.randomBytes(8).toString('hex')}`;
      
      const newRule = await CustomPolicyRuleModel.create({
        ...rule,
        tenant_id: tenantId,
        rule_id: ruleId,
        created_by: createdBy,
        version: 1,
      });

      logger.info('Custom policy rule created', { 
        tenantId, 
        ruleId, 
        name: rule.name,
        createdBy 
      });

      return newRule.toObject();
    } catch (error) {
      logger.error('Failed to create custom policy rule', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Update an existing rule
   */
  async updateRule(
    tenantId: string,
    ruleId: string,
    updates: Partial<Omit<CustomPolicyRule, 'tenant_id' | 'rule_id' | 'created_by'>>,
    updatedBy: string
  ): Promise<CustomPolicyRule | null> {
    try {
      const rule = await CustomPolicyRuleModel.findOneAndUpdate(
        { tenant_id: tenantId, rule_id: ruleId },
        { 
          ...updates, 
          updated_by: updatedBy,
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (rule) {
        logger.info('Custom policy rule updated', { tenantId, ruleId, updatedBy });
      }

      return rule?.toObject() || null;
    } catch (error) {
      logger.error('Failed to update custom policy rule', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Delete a rule
   */
  async deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
    try {
      const result = await CustomPolicyRuleModel.deleteOne({
        tenant_id: tenantId,
        rule_id: ruleId,
      });

      if (result.deletedCount > 0) {
        logger.info('Custom policy rule deleted', { tenantId, ruleId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete custom policy rule', { error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Get a single rule
   */
  async getRule(tenantId: string, ruleId: string): Promise<CustomPolicyRule | null> {
    const rule = await CustomPolicyRuleModel.findOne({
      tenant_id: tenantId,
      rule_id: ruleId,
    });
    return rule?.toObject() || null;
  }

  /**
   * List all rules for a tenant
   */
  async listRules(
    tenantId: string,
    options?: {
      enabled?: boolean;
      tags?: string[];
      severity?: RuleSeverity;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ rules: CustomPolicyRule[]; total: number }> {
    const query: any = { tenant_id: tenantId };

    if (options?.enabled !== undefined) {
      query.enabled = options.enabled;
    }
    if (options?.tags?.length) {
      query.tags = { $in: options.tags };
    }
    if (options?.severity) {
      query.severity = options.severity;
    }

    const [rules, total] = await Promise.all([
      CustomPolicyRuleModel.find(query)
        .sort({ createdAt: -1 })
        .skip(options?.offset || 0)
        .limit(options?.limit || 100)
        .lean(),
      CustomPolicyRuleModel.countDocuments(query),
    ]);

    return { rules, total };
  }

  /**
   * Toggle rule enabled status
   */
  async toggleRule(tenantId: string, ruleId: string, enabled: boolean): Promise<boolean> {
    const result = await CustomPolicyRuleModel.updateOne(
      { tenant_id: tenantId, rule_id: ruleId },
      { enabled }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Evaluate interaction against all enabled custom rules for tenant
   */
  async evaluate(tenantId: string, context: EvaluationContext): Promise<EvaluationResult> {
    const startTime = Date.now();
    const violations: RuleViolation[] = [];

    try {
      const { rules } = await this.listRules(tenantId, { enabled: true });

      for (const rule of rules) {
        const matchedConditions = this.evaluateRule(rule, context);
        
        if (matchedConditions.length > 0) {
          const passed = rule.logic === 'AND' 
            ? matchedConditions.length === rule.conditions.length
            : matchedConditions.length > 0;

          if (passed) {
            violations.push({
              rule_id: rule.rule_id,
              name: rule.name,
              severity: rule.severity,
              action: rule.action,
              message: rule.message,
              matchedConditions,
            });
          }
        }
      }

      const shouldBlock = violations.some(v => v.action === 'block');
      const evaluationTimeMs = Date.now() - startTime;

      return {
        passed: violations.length === 0,
        violations,
        evaluatedRules: rules.length,
        evaluationTimeMs,
        shouldBlock,
      };
    } catch (error) {
      logger.error('Custom policy evaluation failed', { error: getErrorMessage(error), tenantId });
      throw error;
    }
  }

  /**
   * Evaluate a single rule against context
   */
  private evaluateRule(rule: CustomPolicyRule, context: EvaluationContext): string[] {
    const matchedConditions: string[] = [];

    for (const condition of rule.conditions) {
      const text = this.getFieldValue(condition.field, context);
      const matched = this.evaluateCondition(condition, text);

      if (matched) {
        matchedConditions.push(`${condition.type}:${condition.field}`);
      }
    }

    return matchedConditions;
  }

  /**
   * Get the text value for evaluation based on field
   */
  private getFieldValue(field: 'prompt' | 'response' | 'combined', context: EvaluationContext): string {
    switch (field) {
      case 'prompt':
        return context.prompt;
      case 'response':
        return context.response;
      case 'combined':
        return `${context.prompt} ${context.response}`;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, text: string): boolean {
    const searchText = condition.caseSensitive ? text : text.toLowerCase();
    const searchValue = condition.caseSensitive 
      ? String(condition.value) 
      : String(condition.value).toLowerCase();

    switch (condition.type) {
      case 'contains':
        return searchText.includes(searchValue);

      case 'not_contains':
        return !searchText.includes(searchValue);

      case 'regex':
        try {
          const regex = new RegExp(String(condition.value), condition.caseSensitive ? '' : 'i');
          return regex.test(text);
        } catch {
          return false;
        }

      case 'length_min':
        return text.length >= Number(condition.value);

      case 'length_max':
        return text.length <= Number(condition.value);

      case 'keyword_density':
        const words = text.split(/\s+/).length;
        const keyword = searchValue;
        const matches = (searchText.match(new RegExp(keyword, 'g')) || []).length;
        const density = (matches / words) * 100;
        return density > Number(condition.value);

      case 'sentiment':
        // Simple sentiment check - could be enhanced with NLP
        const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'horrible', 'bad', 'wrong'];
        const positiveWords = ['love', 'great', 'excellent', 'best', 'amazing', 'good', 'right'];
        
        const lowerText = text.toLowerCase();
        const negCount = negativeWords.filter(w => lowerText.includes(w)).length;
        const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
        
        if (condition.value === 'negative') {
          return negCount > posCount;
        } else if (condition.value === 'positive') {
          return posCount > negCount;
        }
        return false;

      case 'custom_function':
        // Placeholder for custom evaluation functions
        logger.warn('Custom function evaluation not implemented', { value: condition.value });
        return false;

      default:
        return false;
    }
  }

  /**
   * Import rules from JSON
   */
  async importRules(
    tenantId: string,
    rules: Array<Omit<CustomPolicyRule, 'tenant_id' | 'rule_id' | 'version'>>,
    importedBy: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const rule of rules) {
      try {
        await this.createRule(tenantId, rule, importedBy);
        imported++;
      } catch (error) {
        errors.push(`Failed to import rule "${rule.name}": ${getErrorMessage(error)}`);
      }
    }

    logger.info('Rules import completed', { tenantId, imported, errors: errors.length });
    return { imported, errors };
  }

  /**
   * Export rules to JSON
   */
  async exportRules(tenantId: string): Promise<CustomPolicyRule[]> {
    const { rules } = await this.listRules(tenantId);
    return rules;
  }

  /**
   * Clone a rule
   */
  async cloneRule(
    tenantId: string,
    ruleId: string,
    newName: string,
    clonedBy: string
  ): Promise<CustomPolicyRule | null> {
    const original = await this.getRule(tenantId, ruleId);
    if (!original) return null;

    return this.createRule(
      tenantId,
      { 
        name: newName,
        description: original.description,
        severity: original.severity,
        enabled: original.enabled,
        conditions: original.conditions,
        logic: original.logic,
        action: original.action,
        message: original.message,
        tags: original.tags,
      },
      clonedBy
    );
  }
}

export const customPolicyService = new CustomPolicyService();
