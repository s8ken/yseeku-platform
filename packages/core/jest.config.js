module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleNameMapper: {
    '^@noble/ed25519$': '<rootDir>/../../apps/backend/src/__tests__/mocks/noble-ed25519.mock.js',
    '^isomorphic-dompurify$': '<rootDir>/src/__tests__/mocks/dompurify.mock.js'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
