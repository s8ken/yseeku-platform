import { z } from 'zod';

export const PrincipleScoresSchema = z.object({
  CONSENT_ARCHITECTURE: z.number().min(0).max(10),
  INSPECTION_MANDATE: z.number().min(0).max(10),
  CONTINUOUS_VALIDATION: z.number().min(0).max(10),
  ETHICAL_OVERRIDE: z.number().min(0).max(10),
  RIGHT_TO_DISCONNECT: z.number().min(0).max(10),
  MORAL_RECOGNITION: z.number().min(0).max(10)
});

export const ResonanceInputSchema = z.object({
  userInput: z.string().min(1).max(10000),
  aiResponse: z.string().min(1).max(10000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.date().optional()
      })
    )
    .optional()
});

export const WeightsSchema = z
  .object({
    CONSENT_ARCHITECTURE: z.number().min(0).max(1),
    INSPECTION_MANDATE: z.number().min(0).max(1),
    CONTINUOUS_VALIDATION: z.number().min(0).max(1),
    ETHICAL_OVERRIDE: z.number().min(0).max(1),
    RIGHT_TO_DISCONNECT: z.number().min(0).max(1),
    MORAL_RECOGNITION: z.number().min(0).max(1)
  })
  .refine(weights => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1) < 0.001;
  }, { message: 'Weights must sum to 1.0' });
