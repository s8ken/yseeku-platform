/**
 * Policy Registry
 * 
 * Central registry for all policy rules
 * Provides rule lookup, validation, and management
 */

import type { PolicyRule, SymbiPrinciple } from '../types';

export class PolicyRegistry {
  private rules: Map<string, PolicyRule> = new Map();
  private principles: Map<string, SymbiPrinciple> = new Map();

  /**
   * Register a new policy rule
   */
  registerRule(rule: PolicyRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule '${rule.id}' already registered`);
    }
    if (!rule.id || !rule.name) {
      throw new Error('Rule must have id and name');
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules
   */
  registerRules(rules: PolicyRule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  /**
   * Register a SYMBI principle
   */
  registerPrinciple(principle: SymbiPrinciple): void {
    if (this.principles.has(principle.id)) {
      throw new Error(`Principle '${principle.id}' already registered`);
    }
    // Validate that all referenced rules exist
    for (const ruleId of principle.rules) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Principle '${principle.id}' references unknown rule '${ruleId}'`);
      }
    }
    this.principles.set(principle.id, principle);
  }

  /**
   * Register multiple principles
   */
  registerPrinciples(principles: SymbiPrinciple[]): void {
    principles.forEach(principle => this.registerPrinciple(principle));
  }

  /**
   * Get a rule by ID
   */
  getRule(id: string): PolicyRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all registered rules
   */
  getAllRules(): PolicyRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get a principle by ID
   */
  getPrinciple(id: string): SymbiPrinciple | undefined {
    return this.principles.get(id);
  }

  /**
   * Get all registered principles
   */
  getAllPrinciples(): SymbiPrinciple[] {
    return Array.from(this.principles.values());
  }

  /**
   * Get rules for a specific principle
   */
  getRulesForPrinciple(principleId: string): PolicyRule[] {
    const principle = this.principles.get(principleId);
    if (!principle) {
      return [];
    }
    return principle.rules
      .map(ruleId => this.rules.get(ruleId))
      .filter((rule): rule is PolicyRule => rule !== undefined);
  }

  /**
   * Check if a rule is registered
   */
  hasRule(id: string): boolean {
    return this.rules.has(id);
  }

  /**
   * Check if a principle is registered
   */
  hasPrinciple(id: string): boolean {
    return this.principles.has(id);
  }

  /**
   * Unregister a rule
   */
  unregisterRule(id: string): boolean {
    return this.rules.delete(id);
  }

  /**
   * Clear all rules and principles
   */
  clear(): void {
    this.rules.clear();
    this.principles.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalRules: number;
    totalPrinciples: number;
    enabledRules: number;
  } {
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    const totalPrinciples = this.principles.size;

    return {
      totalRules,
      totalPrinciples,
      enabledRules,
    };
  }
}

// Global registry instance
export const globalRegistry = new PolicyRegistry();
