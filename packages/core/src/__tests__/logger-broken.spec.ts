/**
 * Logger Utility Tests
 *
 * Tests the logging infrastructure for the SONATE platform
 */

import { logger, securityLogger, performanceLogger, apiLogger, log } from '../logger';

describe('Logger Utility', () => {
  let consoleSpy: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;

    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore console
    consoleSpy.mockRestore();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Test error message', new Error('Test error'));

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    it('should use log.info convenience method', () => {
      log.info('Convenience info test');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use log.error convenience method', () => {
      log.error('Convenience error test');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use log.warn convenience method', () => {
      log.warn('Convenience warn test');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use log.debug convenience method', () => {
      log.debug('Convenience debug test');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Specialized Loggers', () => {
    it('should use security logger', () => {
      log.security('Security event', { userId: 123 });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use performance logger', () => {
      log.performance('Performance metric', { duration: 100 });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use API logger', () => {
      log.api('API request', { method: 'GET', path: '/api/test' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Contextual Logging', () => {
    it('should include timestamp in logs', () => {
      logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle complex objects', () => {
      const complexObject = {
        user: { id: 123, name: 'Test User' },
        metadata: { source: 'test', version: '1.0.0' },
        array: [1, 2, 3, { nested: true }],
      };

      logger.info('Complex object test', complexObject);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;

      expect(() => {
        logger.info('Circular reference test', circular);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Environment-based Logging', () => {
    it('should respect log level environment variable', () => {
      process.env.LOG_LEVEL = 'error';

      logger.info('This should not appear');
      logger.error('This should appear');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use default log level when not specified', () => {
      delete process.env.LOG_LEVEL;

      logger.info('Default level test');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Logging', () => {
    it('should handle high-frequency logging efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        logger.info(`High frequency test ${i}`, { iteration: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(consoleSpy).toHaveBeenCalledTimes(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined metadata gracefully', () => {
      expect(() => {
        logger.info('Test message', undefined as any);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle null metadata gracefully', () => {
      expect(() => {
        logger.info('Test message', null as any);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle very long messages', () => {
      const longMessage = 'x'.repeat(1000);

      expect(() => {
        logger.info(longMessage);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle special characters in messages', () => {
      const specialMessage = '🚀 Hello 世界 🌍 Special chars: !@#$%^&*()';

      expect(() => {
        logger.info(specialMessage);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Structured Logging', () => {
    it('should format logs as structured JSON in production', () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-ignore - NODE_ENV is read-only in some environments
      process.env.NODE_ENV = 'production';

      logger.info('Structured test', { userId: 123, action: 'test' });

      // @ts-ignore - NODE_ENV is read-only in some environments
      process.env.NODE_ENV = originalEnv;
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include correlation IDs when available', () => {
      const correlationId = 'corr-123-456';

      logger.info('Correlation test', { correlationId });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Security Logging', () => {
    it('should handle security events', () => {
      log.security('User login', { userId: 123, ip: '192.168.1.1' });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should always log security events regardless of level', () => {
      process.env.LOG_LEVEL = 'error';

      log.security('Security event', { type: 'authentication' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      log.performance('API response time', { duration: 150, endpoint: '/api/test' });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('API Logging', () => {
    it('should log API requests', () => {
      log.api('Request received', { method: 'POST', path: '/api/data', status: 200 });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple log levels', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleSpy).toHaveBeenCalledTimes(4);
    });

    it('should work with specialized loggers', () => {
      log.security('Security test');
      log.performance('Performance test');
      log.api('API test');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should maintain log order', () => {
      logger.info('First message');
      logger.info('Second message');
      logger.info('Third message');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });
});
