import { AsyncLocalStorage } from 'async_hooks'
import { Request, Response, NextFunction } from 'express'

type TenantContext = {
  tenantId: string
  userId?: string
  correlationId?: string
}

const storage = new AsyncLocalStorage<TenantContext>()

export function bindTenantContext(req: Request, res: Response, next: NextFunction): void {
  const tenantId = (req as any).userTenant || (req as any).tenant || 'default'
  const userId = (req as any).userId || 'system'
  const correlationId = (req as any).correlationId
  storage.run({ tenantId, userId, correlationId }, () => next())
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore()
}
