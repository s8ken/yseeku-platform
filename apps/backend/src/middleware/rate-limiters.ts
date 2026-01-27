import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const key = (req: Request) => {
  const userId = (req as any).user?.id || (req as any).userId;
  if (userId) return String(userId);

  const apiKey = req.header('x-api-key');
  if (apiKey) return apiKey;

  if (req.ip) return ipKeyGenerator(req.ip);
  return 'anonymous';
};

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
