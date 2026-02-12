// Test setup file for backend tests

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-test-jwt-secret-test';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-test-refresh-secret-test';

// Clear prom-client registry to prevent "metric already registered" errors
// when multiple test files import modules that create metrics at the top level
try {
  const { register } = require('prom-client');
  register.clear();
} catch {
  // prom-client may not be installed; safe to ignore
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set default timeout for async tests
jest.setTimeout(10000);

