import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from '../observability/metrics';

export function httpMetrics(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationNs = Number(end - start);
    const durationSec = durationNs / 1e9;
    const route = (req.route && (req.route.path as string)) || req.path || 'unknown';
    recordHttpRequest(req.method, route, res.statusCode, durationSec);
  });
  next();
}

