module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|@noble/hashes)/)'
  ],
};
