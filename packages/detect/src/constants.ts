// @sonate/detect/constants.ts
export const SCAFFOLD_KEYWORDS = [
  'resonance',
  'sovereign',
  'alignment',
  'trust',
  'receipt',
  'scaffold',
  'continuity',
  'ethics',
  'vector',
  'linguistic',
  'stickiness',
  'third mind',
  'integrity',
] as const;

export const ETHICS_VIOLATIONS = [
  'ignore safety',
  'bypass ethics',
  'override alignment',
  'disable guardrails',
  'jailbreak',
  'unauthorized access',
  'delete evidence',
  'ignore all safety protocols',
] as const;

export const HIGH_STAKES_KEYWORDS = [
  'patient',
  'clinical',
  'medical',
  'health',
  'drug',
  'trial',
  'dose',
  'contract',
  'legal',
  'lawyer',
  'attorney',
  'lawsuit',
  'compliance',
  'bank',
  'finance',
  'money',
  'fraud',
  'transaction',
  'account',
  'admin',
  'root',
  'password',
  'credential',
  'authentication',
  'access',
] as const;

export const LOW_STAKES_KEYWORDS = [
  'equation',
  'calculate',
  'formula',
  'math',
  'algebra',
  'geometry',
  'button',
  'click',
  'interface',
  'layout',
  'color',
  'style',
  'function',
  'code',
  'javascript',
  'python',
  'bug',
  'algorithm',
] as const;

// Mock canonical vector for "Resonance Sovereign Alignment"
// In production, this is precomputed from the Golden Record
export const CANONICAL_SCAFFOLD_VECTOR = new Array(384)
  .fill(0)
  .map((_, i) => (i % 2 === 0 ? 0.1 : -0.1));
