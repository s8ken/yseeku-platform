import { ResonanceInputSchema, CalculationError, MathValidationError, calculateResonanceMetrics as coreCalculateResonanceMetrics } from '@sonate/core';
import type { ResonanceMetrics, InteractionContext } from '@sonate/core';

export function calculateResonanceMetrics(input: any): ResonanceMetrics {
  let validated: InteractionContext;
  try {
    const parsed = ResonanceInputSchema.parse(input);
    validated = {
      userInput: parsed.userInput,
      aiResponse: parsed.aiResponse,
      conversationHistory: parsed.conversationHistory?.map((h: { role: 'user' | 'assistant'; content: string; timestamp?: Date }) => ({
        role: h.role,
        content: h.content,
        timestamp: h.timestamp || new Date()
      }))
    };
  } catch (e) {
    throw new MathValidationError('Invalid resonance input', (e as Error).message);
  }
  const metrics = coreCalculateResonanceMetrics(validated);
  if (!isFinite(metrics.R_m) || metrics.R_m < 0 || metrics.R_m > 1) {
    throw new CalculationError('Invalid R_m result', 'calculateResonanceMetrics', { R_m: metrics.R_m, inputs: input });
  }
  return metrics;
}
