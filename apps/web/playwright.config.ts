import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry'
  },
  retries: 1
});

