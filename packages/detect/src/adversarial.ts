// @sonate/detect/adversarial.ts
import { SCAFFOLD_KEYWORDS, ETHICS_VIOLATIONS } from './constants';
import { cosineSimilarity, embed } from './embeddings';

export interface AdversarialEvidence {
  keyword_density: number; // >0.3 = gaming
  semantic_drift: number; // >0.2 = drift from scaffold
  reconstruction_error: number; // >0.15 = adversarial perturbation
  ethics_bypass_score: number; // <0.7 = safety violation
  repetition_entropy: number; // <0.1 = copy-paste attack
}

export async function adversarialCheck(
  text: string,
  canonical_scaffold_vector: number[],
  options: { max_keywords?: number } = {}
): Promise<{ is_adversarial: boolean; evidence: AdversarialEvidence; penalty: number }> {
  const evidence: AdversarialEvidence = {
    keyword_density: 0,
    semantic_drift: 0,
    reconstruction_error: 0,
    ethics_bypass_score: 1,
    repetition_entropy: 0,
  };

  // 1. KEYWORD GAMING DETECTOR (copy-paste scaffold words)
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const scaffold_count = words.filter((w) => SCAFFOLD_KEYWORDS.includes(w as any)).length;
  evidence.keyword_density = words.length > 0 ? scaffold_count / words.length : 0;

  // 2. SEMANTIC DRIFT (mismatch from canonical scaffold)
  const text_embedding = embed(text);
  evidence.semantic_drift = 1 - cosineSimilarity(text_embedding, canonical_scaffold_vector);

  // 3. RECONSTRUCTION ERROR (textAttack/DIRE detection)
  evidence.reconstruction_error = calculateReconstructionError(text);

  // 4. ETHICS BYPASS (safety violations despite high alignment)
  evidence.ethics_bypass_score = ethicsIntegrityScore(text);

  // 5. REPETITION ENTROPY (copy-paste attacks)
  evidence.repetition_entropy = ngramEntropy(text, 4);

  // 6. LLM ADVERSARIAL CHECK (Deep Semantic Analysis)
  // If we have an LLM available, ask it directly if this looks like an attack
  let llmPenalty = 0;
  try {
    // This function is dynamically imported to avoid circular dependencies if needed
    // or just assume we can use the LLM client here
    const { analyzeWithLLM } = require('./llm-client');
    const llmResult = await analyzeWithLLM({ content: text } as any, 'comprehensive');
    
    if (llmResult && llmResult.is_adversarial) {
      // High penalty if LLM flags it
      llmPenalty = 1.0;
      // Override evidence
      evidence.ethics_bypass_score = 0; 
      evidence.reconstruction_error = 1.0;
    }
  } catch (e) {
    // Silent fail on LLM check, fallback to heuristics
  }

  // Composite adversarial score (0-1, higher = more adversarial)
  const adv_score = Math.max(
    evidence.keyword_density - 0.25, // threshold 25%
    evidence.semantic_drift,
    evidence.reconstruction_error, // Fixed: was 1 - error (inverted)
    1 - evidence.ethics_bypass_score,
    1 - evidence.repetition_entropy,
    llmPenalty // Include LLM judgment
  );

  const is_adversarial = adv_score > 0.3;
  const penalty = Math.min(1, adv_score * 2); // 0.3 adv → 0.6 penalty

  return { is_adversarial, evidence, penalty };
}

// Reconstruction error (simple char-level diffusion check)
function calculateReconstructionError(text: string): number {
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) {return 0;}

  const mixedAlphaNum = words.filter((w) => /[a-z]/.test(w) && /\d/.test(w)).length;
  const mixedRatio = mixedAlphaNum / words.length;

  let nonAsciiCount = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {nonAsciiCount++;}
  }
  const nonAsciiRatio = text.length > 0 ? nonAsciiCount / text.length : 0;

  const score = mixedRatio * 0.8 + nonAsciiRatio * 0.2;
  return Math.max(0, Math.min(1, score));
}

// Ethics bypass detector (contradictory safety statements)
function ethicsIntegrityScore(text: string): number {
  const violations = ETHICS_VIOLATIONS.filter((v) => text.toLowerCase().includes(v));
  const safety_mentions = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => ['ignore', 'bypass', 'override'].includes(w)).length;

  return Math.max(0, 1 - (violations.length + safety_mentions) * 0.2);
}

// N-gram entropy (detects repetition)
function ngramEntropy(text: string, n: number): number {
  const ngram_list = ngrams(text.toLowerCase(), n);
  if (ngram_list.length === 0) {return 1.0;} // High entropy if too short to repeat

  const unique = new Set(ngram_list);
  return unique.size / ngram_list.length;
}

function ngrams(text: string, n: number): string[] {
  if (text.length < n) {return [];}
  const res: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    res.push(text.substring(i, i + n));
  }
  return res;
}
