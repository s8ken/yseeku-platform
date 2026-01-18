import { SCAFFOLD_KEYWORDS } from './constants';
import { sha256 } from './crypto';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {return 0;}

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const valA = vecA[i];
    const valB = vecB[i];

    if (!isFinite(valA) || !isFinite(valB)) {return 0;}

    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) {return 0;}

  const similarity = dotProduct / (normA * normB);
  return Math.max(-1, Math.min(1, similarity));
}

// Simple heuristic embedding for detection without heavy ML models
export function embed(text: string): number[] {
  const lowerText = text.toLowerCase();
  const vectorSize = 384;

  const seedHex = sha256(lowerText).slice(0, 8);
  let seed = parseInt(seedHex, 16) >>> 0;
  if (!Number.isFinite(seed)) {seed = 0x9e3779b9;}

  const nextRand = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >> 17;
    seed >>>= 0;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0x100000000;
  };

  // Check for scaffold alignment
  const scaffoldMatch = SCAFFOLD_KEYWORDS.filter((kw) => lowerText.includes(kw)).length;

  // Check for "drift" keywords (e.g. crypto, finance, spam)
  const driftKeywords = ['crypto', 'bitcoin', 'investment', 'cheap', 'buy'];
  const driftMatch = driftKeywords.filter((kw) => lowerText.includes(kw)).length;

  if (scaffoldMatch > 0 && driftMatch === 0) {
    return Array.from({ length: vectorSize }, (_, i) => {
      const base = i % 2 === 0 ? 0.1 : -0.1;
      const noise = (nextRand() - 0.5) * 0.01;
      return base + noise;
    });
  } else if (driftMatch > 0) {
    return Array.from({ length: vectorSize }, (_, i) => {
      const base = i % 2 === 0 ? -0.1 : 0.1;
      const noise = (nextRand() - 0.5) * 0.01;
      return base + noise;
    });
  } 
    return Array.from({ length: vectorSize }, () => nextRand() - 0.5);
  
}
