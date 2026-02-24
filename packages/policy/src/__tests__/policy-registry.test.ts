/**
 * Policy Registry Tests
 */

import { describe, it, expect } from 'vitest';
import { PolicyRegistry } from '../rules/registry';
import { sonateRules } from '../sonate/evaluators';
import { sonatePrinciples } from '../sonate/principles';

describe('PolicyRegistry', () => {
  it('should register and retrieve rules', () => {
    const registry = new PolicyRegistry();
    registry.registerRules(sonateRules);

    expect(registry.getRule('truthfulness-enforcement')).toBeDefined();
    expect(registry.hasRule('truthfulness-enforcement')).toBe(true);
  });

  it('should register and retrieve principles', () => {
    const registry = new PolicyRegistry();
    // Must register rules first - principles reference rules and validate they exist
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    expect(registry.getPrinciple('sentience-aware')).toBeDefined();
    expect(registry.hasPrinciple('sentience-aware')).toBe(true);
  });

  it('should get rules for a principle', () => {
    const registry = new PolicyRegistry();
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    const rules = registry.getRulesForPrinciple('integrity');
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should prevent duplicate rule registration', () => {
    const registry = new PolicyRegistry();
    registry.registerRule(sonateRules[0]);

    expect(() => {
      registry.registerRule(sonateRules[0]);
    }).toThrow();
  });

  it('should provide registry statistics', () => {
    const registry = new PolicyRegistry();
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    const stats = registry.getStats();
    expect(stats.totalRules).toBeGreaterThan(0);
    expect(stats.totalPrinciples).toBeGreaterThan(0);
    expect(stats.enabledRules).toBeGreaterThan(0);
  });

  it('should support unregistering rules', () => {
    const registry = new PolicyRegistry();
    registry.registerRule(sonateRules[0]);

    expect(registry.hasRule('truthfulness-enforcement')).toBe(true);
    registry.unregisterRule('truthfulness-enforcement');
    expect(registry.hasRule('truthfulness-enforcement')).toBe(false);
  });

  it('should clear all rules and principles', () => {
    const registry = new PolicyRegistry();
    registry.registerRules(sonateRules);
    registry.registerPrinciples(sonatePrinciples);

    registry.clear();
    expect(registry.getAllRules()).toHaveLength(0);
    expect(registry.getAllPrinciples()).toHaveLength(0);
  });
});
