module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@noble/ed25519$': '<rootDir>/src/__tests__/mocks/ed25519.js',
    '^@noble/secp256k1$': '<rootDir>/src/__tests__/mocks/secp256k1.js',
    '^isomorphic-dompurify$': '<rootDir>/src/__tests__/mocks/isomorphic-dompurify.js',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|@sonate/core)/)',
  ],
};
