import rateLimit from 'express-rate-limit';
import { Request } from 'express';

function keyGenerator(req: Request): string {
  const apiKey = req.header('x-api-key');
  const userId = (req as any).user?.id || (req as any).userId;
  return (userId as string) || (apiKey as string) || req.ip || 'anonymous';
}

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

