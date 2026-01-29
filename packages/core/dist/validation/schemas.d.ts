import { z } from 'zod';
export declare const PrincipleScoresSchema: z.ZodObject<{
    CONSENT_ARCHITECTURE: z.ZodNumber;
    INSPECTION_MANDATE: z.ZodNumber;
    CONTINUOUS_VALIDATION: z.ZodNumber;
    ETHICAL_OVERRIDE: z.ZodNumber;
    RIGHT_TO_DISCONNECT: z.ZodNumber;
    MORAL_RECOGNITION: z.ZodNumber;
}, z.core.$strip>;
export declare const ResonanceInputSchema: z.ZodObject<{
    userInput: z.ZodString;
    aiResponse: z.ZodString;
    conversationHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
        timestamp: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const WeightsSchema: z.ZodObject<{
    CONSENT_ARCHITECTURE: z.ZodNumber;
    INSPECTION_MANDATE: z.ZodNumber;
    CONTINUOUS_VALIDATION: z.ZodNumber;
    ETHICAL_OVERRIDE: z.ZodNumber;
    RIGHT_TO_DISCONNECT: z.ZodNumber;
    MORAL_RECOGNITION: z.ZodNumber;
}, z.core.$strip>;
