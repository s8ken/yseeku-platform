import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

function keyGenerator(req: Request): string {
  const apiKey = req.header('x-api-key');
  const userId = (req as any).user?.id || (req as any).userId;
  if (userId) return String(userId);
  if (apiKey) return apiKey;
  if (req.ip) return ipKeyGenerator(req.ip);
  return 'anonymous';
}

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
