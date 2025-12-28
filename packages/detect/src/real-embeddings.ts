// Mock implementation for real-embeddings
export interface EmbeddingResult {
  vector: number[];
  confidence: number;
  model_used: string;
  inference_time_ms: number;
  cache_hit: boolean;
}

export async function embed(text: string): Promise<number[]> {
  // Simple mock embedding - in production this would use actual models
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return new Array(384).fill(0).map((_, i) => Math.sin(hash + i) * 0.5 + 0.5);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}