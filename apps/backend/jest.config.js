module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|@noble/secp256k1|uuid)/)'
  ],
  moduleNameMapper: {
    '^@sonate/detect$': '<rootDir>/src/__tests__/mocks/sonate-detect.mock.js',
    '^@noble/ed25519$': '<rootDir>/src/__tests__/mocks/noble-ed25519.mock.js',
    '^@noble/secp256k1$': '<rootDir>/src/__tests__/mocks/noble-secp256k1.mock.js',
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.mock.js'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};