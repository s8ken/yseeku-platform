export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
  };
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  duration?: number;
  traceId?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.SERVICE_NAME || 'sonate-web',
    context,
    traceId: context?.traceId as string | undefined
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('debug')) return;
    const entry = createLogEntry('debug', message, context);
    console.debug(formatLogEntry(entry));
  },

  info(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('info')) return;
    const entry = createLogEntry('info', message, context);
    console.info(formatLogEntry(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (!shouldLog('warn')) return;
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogEntry(entry));
  },

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    if (!shouldLog('error')) return;
    const entry = createLogEntry('error', message, context);
    
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error) {
      entry.error = {
        name: 'UnknownError',
        message: String(error)
      };
    }
    
    console.error(formatLogEntry(entry));
  },

  fatal(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    if (!shouldLog('fatal')) return;
    const entry = createLogEntry('fatal', message, context);
    
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    console.error(formatLogEntry(entry));
  },

  request(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, unknown>
  ) {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    if (!shouldLog(level)) return;
    
    const entry = createLogEntry(level, `${method} ${url} ${statusCode}`, context);
    entry.request = { method, url };
    entry.duration = duration;
    
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      formatLogEntry(entry)
    );
  },

  audit(
    action: string,
    userId: string,
    resource: string,
    details?: Record<string, unknown>
  ) {
    const entry = createLogEntry('info', `AUDIT: ${action} on ${resource}`, {
      ...details,
      audit: true
    });
    entry.user = { id: userId };
    
    console.info(formatLogEntry(entry));
  },

  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, unknown>
  ) {
    const level: LogLevel = severity === 'critical' ? 'fatal' : 
                            severity === 'high' ? 'error' : 
                            severity === 'medium' ? 'warn' : 'info';
    
    const entry = createLogEntry(level, `SECURITY: ${event}`, {
      ...details,
      security: true,
      severity
    });
    
    console[level === 'fatal' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      formatLogEntry(entry)
    );
  }
};

export function createChildLogger(defaultContext: Record<string, unknown>) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      logger.debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
      logger.error(message, error, { ...defaultContext, ...context }),
    fatal: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
      logger.fatal(message, error, { ...defaultContext, ...context })
  };
}
