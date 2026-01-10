import { test, expect } from '@playwright/test';

test('loads home page', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title).toBeTruthy();
});

