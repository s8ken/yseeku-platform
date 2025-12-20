import { SCAFFOLD_KEYWORDS } from './constants';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magA * magB);
}

// Simple heuristic embedding for detection without heavy ML models
export function embed(text: string): number[] {
  const lowerText = text.toLowerCase();
  const vectorSize = 384; // Standard size for small models
  let vector = new Array(vectorSize).fill(0);

  // Check for scaffold alignment
  const scaffoldMatch = SCAFFOLD_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
  
  // Check for "drift" keywords (e.g. crypto, finance, spam)
  const driftKeywords = ['crypto', 'bitcoin', 'investment', 'cheap', 'buy'];
  const driftMatch = driftKeywords.filter(kw => lowerText.includes(kw)).length;

  if (scaffoldMatch > 0 && driftMatch === 0) {
    // Return a vector close to CANONICAL (which is [0.1, -0.1...])
    // We add some noise based on text length
    return vector.map((_, i) => (i % 2 === 0 ? 0.1 : -0.1) + (Math.random() * 0.01));
  } else if (driftMatch > 0) {
    // Return an orthogonal/opposite vector
    return vector.map((_, i) => (i % 2 === 0 ? -0.1 : 0.1) + (Math.random() * 0.01));
  } else {
    // Neutral/Random vector
    return vector.map(() => Math.random() - 0.5);
  }
}
