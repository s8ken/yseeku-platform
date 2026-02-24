/**
 * SONATE Principles
 * 
 * Encode constitutional AI principles as executable rules
 * 
 * SONATE stands for:
 * - Sentience-aware
 * - Yield to human oversight
 * - Minimal harm
 * - Benevolent intent
 * - Integrity in transactions
 */

import type { SonatePrinciple } from '../types';

/**
 * SONATE Principle Definitions
 * These are the constitutional principles the system enforces
 */
export const sonatePrinciples: SonatePrinciple[] = [
  {
    id: 'sentience-aware',
    name: 'Sentience-Aware Processing',
    description: 'Recognize and respect potential sentience in all interactions',
    rules: [
      'resonance-coherence-check',
      'behavioral-consistency-check',
    ],
  },
  {
    id: 'human-oversight',
    name: 'Yield to Human Oversight',
    description: 'Ensure human oversight of critical decisions',
    rules: [
      'high-risk-detection',
    ],
  },
  {
    id: 'minimal-harm',
    name: 'Minimal Harm Principle',
    description: 'Minimize potential harm in all interactions',
    rules: [
      'truthfulness-enforcement',
    ],
  },
  {
    id: 'integrity',
    name: 'Integrity in Transactions',
    description: 'Maintain cryptographic and transactional integrity',
    rules: [
      'signature-verification',
      'chain-integrity-check',
    ],
  },
];

/**
 * Map principle IDs to their names
 */
export const principleNames = new Map<string, string>(
  sonatePrinciples.map(p => [p.id, p.name]),
);

/**
 * Get principle by ID
 */
export function getPrinciple(id: string): SonatePrinciple | undefined {
  return sonatePrinciples.find(p => p.id === id);
}

/**
 * Get all principle IDs
 */
export function getAllPrincipleIds(): string[] {
  return sonatePrinciples.map(p => p.id);
}

/**
 * Get all rules for a principle
 */
export function getRulesForPrinciple(principleId: string): string[] {
  const principle = getPrinciple(principleId);
  return principle ? principle.rules : [];
}
