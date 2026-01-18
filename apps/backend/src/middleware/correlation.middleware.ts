import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerId = (req.headers['x-correlation-id'] as string) || ''
  const id = headerId && headerId.trim().length > 0 ? headerId : uuidv4()
  ;(req as any).correlationId = id
  res.setHeader('x-correlation-id', id)
  next()
}
