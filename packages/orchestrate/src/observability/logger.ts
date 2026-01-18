import { winstonLogger } from './logger-config';

export class Logger {
  constructor(private name: string) {}

  debug(message: string, meta?: any) {
    winstonLogger.debug(`[${this.name}] ${message}`, meta);
  }

  info(message: string, meta?: any) {
    winstonLogger.info(`[${this.name}] ${message}`, meta);
  }

  warn(message: string, meta?: any) {
    winstonLogger.warn(`[${this.name}] ${message}`, meta);
  }

  error(message: string, meta?: any) {
    winstonLogger.error(`[${this.name}] ${message}`, meta);
  }

  // Add HTTP logging level for requests
  http(message: string, meta?: any) {
    winstonLogger.log('http', `[${this.name}] ${message}`, meta);
  }
}

const registry: Record<string, Logger> = {};

export function getLogger(name: string): Logger {
  if (!registry[name]) {
    registry[name] = new Logger(name);
  }
  return registry[name];
}
