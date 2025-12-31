import { winstonLogger } from './logger-config';
import { tenantContext } from '@sonate/core';

export class Logger {
  constructor(private name: string) {}

  private getMeta(meta?: any): any {
    const context = tenantContext.get();
    if (!context) return meta;

    return {
      ...meta,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.metadata?.requestId
    };
  }

  debug(message: string, meta?: any) {
    winstonLogger.debug(`[${this.name}] ${message}`, this.getMeta(meta));
  }

  info(message: string, meta?: any) {
    winstonLogger.info(`[${this.name}] ${message}`, this.getMeta(meta));
  }

  warn(message: string, meta?: any) {
    winstonLogger.warn(`[${this.name}] ${message}`, this.getMeta(meta));
  }

  error(message: string, meta?: any) {
    winstonLogger.error(`[${this.name}] ${message}`, this.getMeta(meta));
  }

  // Add HTTP logging level for requests
  http(message: string, meta?: any) {
    winstonLogger.log('http', `[${this.name}] ${message}`, this.getMeta(meta));
  }
}

const registry: Record<string, Logger> = {};

export function getLogger(name: string): Logger {
  if (!registry[name]) {
    registry[name] = new Logger(name);
  }
  return registry[name];
}