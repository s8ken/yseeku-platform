import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const key = (req: Request) => ((req as any).user?.id || (req as any).userId || req.header('x-api-key') || req.ip || 'anonymous') as string;

export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LLM_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: key,
});

export const apiGatewayLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: key,
});

