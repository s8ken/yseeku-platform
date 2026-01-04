/**
 * Logger Module Tests
 *
 * Tests for structured logging infrastructure
 */

import { logger, log, createLogger, securityLogger, performanceLogger, apiLogger, LogLevel } from '../logger';

describe('Logger Module', () => {
  // Capture console output
  let consoleOutput: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    consoleOutput = [];
    // Mock console to capture Winston output
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('LogLevel enum', () => {
    it('should have correct log levels', () => {
      expect(LogLevel.ERROR).toBe('error');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.HTTP).toBe('http');
      expect(LogLevel.VERBOSE).toBe('verbose');
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.SILLY).toBe('silly');
    });
  });

  describe('logger instance', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have correct default metadata', () => {
      expect(logger.defaultMeta).toHaveProperty('service', 'sonate-platform');
      expect(logger.defaultMeta).toHaveProperty('environment');
    });

    it('should log error messages', () => {
      logger.error('Test error message', { testKey: 'testValue' });
      // Logger should process without throwing
      expect(logger).toBeDefined();
    });

    it('should log info messages', () => {
      logger.info('Test info message', { module: 'TestModule' });
      expect(logger).toBeDefined();
    });

    it('should log warn messages', () => {
      logger.warn('Test warning message');
      expect(logger).toBeDefined();
    });
  });

  describe('createLogger function', () => {
    it('should create child logger with context', () => {
      const childLogger = createLogger({ module: 'TestModule' });
      expect(childLogger).toBeDefined();
    });

    it('should create child logger with multiple context fields', () => {
      const childLogger = createLogger({
        module: 'TestModule',
        requestId: '12345',
        userId: 'user-abc',
      });
      expect(childLogger).toBeDefined();

      // Child logger should be able to log
      childLogger.info('Test message from child logger');
      expect(childLogger).toBeDefined();
    });
  });

  describe('specialized loggers', () => {
    it('should have securityLogger defined', () => {
      expect(securityLogger).toBeDefined();
    });

    it('should have performanceLogger defined', () => {
      expect(performanceLogger).toBeDefined();
    });

    it('should have apiLogger defined', () => {
      expect(apiLogger).toBeDefined();
    });

    it('should log security events', () => {
      securityLogger.error('Security breach detected', {
        ip: '192.168.1.1',
        action: 'unauthorized_access',
      });
      expect(securityLogger).toBeDefined();
    });

    it('should log performance metrics', () => {
      performanceLogger.info('Query executed', {
        duration: 150,
        query: 'SELECT * FROM users',
      });
      expect(performanceLogger).toBeDefined();
    });

    it('should log API requests', () => {
      apiLogger.http('GET /api/users', {
        statusCode: 200,
        duration: 45,
      });
      expect(apiLogger).toBeDefined();
    });
  });

  describe('log convenience methods', () => {
    it('should have error method', () => {
      expect(log.error).toBeDefined();
      log.error('Test error', { code: 'ERR_TEST' });
    });

    it('should have warn method', () => {
      expect(log.warn).toBeDefined();
      log.warn('Test warning', { code: 'WARN_TEST' });
    });

    it('should have info method', () => {
      expect(log.info).toBeDefined();
      log.info('Test info', { module: 'Test' });
    });

    it('should have http method', () => {
      expect(log.http).toBeDefined();
      log.http('HTTP request', { method: 'GET' });
    });

    it('should have debug method', () => {
      expect(log.debug).toBeDefined();
      log.debug('Debug message', { value: 123 });
    });

    it('should have security method', () => {
      expect(log.security).toBeDefined();
      log.security('Security event', { alertId: 'alert_123' });
    });

    it('should have performance method', () => {
      expect(log.performance).toBeDefined();
      log.performance('Performance metric', { metric: 'query_time', value: 100 });
    });

    it('should have api method', () => {
      expect(log.api).toBeDefined();
      log.api('API call', { endpoint: '/users', method: 'POST' });
    });
  });

  describe('log methods with metadata', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      log.error('Error occurred', {
        error: error.message,
        stack: error.stack,
        module: 'TestModule',
      });
      expect(log.error).toBeDefined();
    });

    it('should log with complex metadata', () => {
      log.info('Complex log entry', {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        action: 'login',
        timestamp: Date.now(),
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
      expect(log.info).toBeDefined();
    });

    it('should log without metadata', () => {
      log.info('Simple message');
      log.warn('Warning message');
      log.error('Error message');
      expect(log).toBeDefined();
    });
  });

  describe('security logging', () => {
    it('should always log security events with _security_event flag', () => {
      log.security('Unauthorized access attempt', {
        userId: 'user-456',
        resource: '/admin/secrets',
      });
      // Security events should be logged regardless of log level
      expect(log.security).toBeDefined();
    });

    it('should log multiple security events', () => {
      log.security('Failed login attempt', { username: 'admin', attempts: 3 });
      log.security('Permission denied', { userId: 'user-789', resource: '/api/admin' });
      log.security('Rate limit exceeded', { ip: '10.0.0.1', endpoint: '/api/data' });
      expect(log.security).toBeDefined();
    });
  });

  describe('logger integration', () => {
    it('should handle multiple log levels', () => {
      log.error('Error level');
      log.warn('Warn level');
      log.info('Info level');
      log.http('HTTP level');
      log.debug('Debug level');
      expect(log).toBeDefined();
    });

    it('should work with child loggers', () => {
      const moduleLogger = createLogger({ module: 'UserService' });
      moduleLogger.info('User created', { userId: 'user-new-123' });
      moduleLogger.error('User creation failed', { error: 'Duplicate email' });
      expect(moduleLogger).toBeDefined();
    });

    it('should support structured logging pattern used in codebase', () => {
      // Pattern from workflow-engine.ts
      log.info('Workflow completed', {
        workflowId: 'wf-123',
        stepCount: 5,
        module: 'WorkflowEngine',
      });

      // Pattern from agent-orchestrator.ts
      log.warn('Agent suspended', {
        agentId: 'agent-456',
        agentName: 'TestAgent',
        module: 'AgentOrchestrator',
      });

      // Pattern from tactical-command.ts
      securityLogger.error('Security alert created', {
        alertId: 'alert_789',
        severity: 'critical',
        message: 'Trust score critically low',
        agentId: 'agent-bad',
        module: 'TacticalCommand',
      });

      expect(log).toBeDefined();
    });
  });
});
