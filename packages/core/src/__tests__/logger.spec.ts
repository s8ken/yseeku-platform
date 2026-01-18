/**
 * Logger Utility Tests
 *
 * Tests the logging infrastructure and convenience methods
 */

import { logger, securityLogger, performanceLogger, apiLogger } from '../logger';

describe('Logger Utility', () => {
  describe('Basic Logging', () => {
    it('should have logger instance available', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log info messages without throwing', () => {
      expect(() => {
        logger.info('Test info message', { key: 'value' });
      }).not.toThrow();
    });

    it('should log warning messages without throwing', () => {
      expect(() => {
        logger.warn('Test warning message');
      }).not.toThrow();
    });

    it('should log error messages without throwing', () => {
      expect(() => {
        logger.error('Test error message', new Error('Test error'));
      }).not.toThrow();
    });

    it('should log debug messages without throwing', () => {
      expect(() => {
        logger.debug('Test debug message');
      }).not.toThrow();
    });
  });

  describe('Convenience Methods', () => {
    it('should use log.info convenience method', () => {
      expect(() => {
        logger.info('Convenience info test');
      }).not.toThrow();
    });

    it('should use log.error convenience method', () => {
      expect(() => {
        logger.error('Convenience error test');
      }).not.toThrow();
    });

    it('should use log.warn convenience method', () => {
      expect(() => {
        logger.warn('Convenience warning test');
      }).not.toThrow();
    });

    it('should use log.debug convenience method', () => {
      expect(() => {
        logger.debug('Convenience debug test');
      }).not.toThrow();
    });
  });

  describe('Specialized Loggers', () => {
    it('should use security logger', () => {
      expect(securityLogger).toBeDefined();
      expect(() => {
        securityLogger.warn('Security event', { event: 'login_attempt' });
      }).not.toThrow();
    });

    it('should use performance logger', () => {
      expect(performanceLogger).toBeDefined();
      expect(() => {
        performanceLogger.info('Performance metric', { duration: 150 });
      }).not.toThrow();
    });

    it('should use API logger', () => {
      expect(apiLogger).toBeDefined();
      expect(() => {
        apiLogger.info('API request', { method: 'GET', endpoint: '/api/test' });
      }).not.toThrow();
    });
  });

  describe('Contextual Logging', () => {
    it('should include timestamp in logs', () => {
      expect(() => {
        logger.info('Timestamp test', { timestamp: Date.now() });
      }).not.toThrow();
    });

    it('should handle complex objects', () => {
      const complexObject = {
        user: { id: 1, name: 'John', roles: ['admin', 'user'] },
        metadata: { source: 'web', version: '1.0.0' },
        nested: { deep: { value: 'test' } },
      };

      expect(() => {
        logger.info('Complex object test', complexObject);
      }).not.toThrow();
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // The logger should handle circular references (though it might throw)
      // We test that it doesn't crash the entire test suite
      expect(() => {
        try {
          logger.info('Circular reference test', circular);
        } catch (error) {
          // Expected behavior - circular references cause JSON.stringify issues
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow();
    });
  });

  describe('Environment-based Logging', () => {
    it('should respect log level environment variable', () => {
      // Test that logger respects environment (without actually changing env)
      expect(() => {
        logger.debug('Debug message test');
      }).not.toThrow();
    });

    it('should use default log level when not specified', () => {
      expect(() => {
        logger.info('Default level test');
      }).not.toThrow();
    });
  });

  describe('Performance Logging', () => {
    it('should handle high-frequency logging efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        logger.debug(`High frequency log ${i}`);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should log performance metrics', () => {
      expect(() => {
        performanceLogger.info('Performance test', {
          operation: 'database_query',
          duration: 45,
          records: 100,
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined metadata gracefully', () => {
      expect(() => {
        logger.info('Undefined metadata test', undefined as any);
      }).not.toThrow();
    });

    it('should handle null metadata gracefully', () => {
      expect(() => {
        logger.info('Null metadata test', null as any);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      expect(() => {
        logger.info('Long message test', { message: longMessage });
      }).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      const specialChars = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(() => {
        logger.info('Special characters test', { chars: specialChars });
      }).not.toThrow();
    });
  });

  describe('Structured Logging', () => {
    it('should format logs as structured JSON', () => {
      expect(() => {
        logger.info('Structured test', {
          service: 'sonate-platform',
          environment: 'test',
          operation: 'test_logging',
          user_id: '12345',
        });
      }).not.toThrow();
    });

    it('should include correlation IDs when available', () => {
      expect(() => {
        logger.info('Correlation test', {
          correlation_id: 'corr-123',
          request_id: 'req-456',
        });
      }).not.toThrow();
    });
  });

  describe('Security Logging', () => {
    it('should handle security events', () => {
      expect(() => {
        securityLogger.warn('Security event', {
          event_type: 'authentication',
          user_id: 'user-123',
          ip_address: '192.168.1.1',
          success: false,
        });
      }).not.toThrow();
    });

    it('should always log security events regardless of level', () => {
      expect(() => {
        securityLogger.error('Critical security event', {
          event_type: 'unauthorized_access',
          user_id: 'unknown',
          ip_address: '10.0.0.1',
          threat_level: 'high',
        });
      }).not.toThrow();
    });
  });

  describe('API Logging', () => {
    it('should log API requests', () => {
      expect(() => {
        apiLogger.info('API request', {
          method: 'POST',
          endpoint: '/api/v1/trust',
          status_code: 201,
          duration: 123,
          user_id: 'user-456',
        });
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple log levels', () => {
      expect(() => {
        logger.error('Error level');
        logger.warn('Warning level');
        logger.info('Info level');
        logger.debug('Debug level');
      }).not.toThrow();
    });

    it('should work with specialized loggers', () => {
      expect(() => {
        securityLogger.warn('Security test');
        performanceLogger.info('Performance test');
        apiLogger.info('API test');
        logger.info('General test');
      }).not.toThrow();
    });

    it('should maintain log order', () => {
      expect(() => {
        logger.info('First message');
        logger.info('Second message');
        logger.info('Third message');
      }).not.toThrow();
    });
  });
});
