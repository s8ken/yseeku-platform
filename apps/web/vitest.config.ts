import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      'src/components/__tests__/**',
      'src/app/**/__tests__/**',
      'node_modules/**'
    ],
    environment: 'node',
    globals: false,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
