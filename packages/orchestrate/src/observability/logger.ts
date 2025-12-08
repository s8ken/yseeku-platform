export class Logger {
  constructor(private name: string) {}

  private format(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) {
    const ts = new Date().toISOString();
    const base = `[${ts}] [${this.name}] ${level.toUpperCase()}: ${message}`;
    return meta ? `${base} ${JSON.stringify(meta)}` : base;
  }

  debug(message: string, meta?: any) {
    console.debug(this.format('debug', message, meta));
  }

  info(message: string, meta?: any) {
    console.info(this.format('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: any) {
    console.error(this.format('error', message, meta));
  }
}

const registry: Record<string, Logger> = {};

export function getLogger(name: string): Logger {
  if (!registry[name]) {
    registry[name] = new Logger(name);
  }
  return registry[name];
}