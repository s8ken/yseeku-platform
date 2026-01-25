import { test, expect } from '@playwright/test';

test('API health returns structure', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json).toHaveProperty('status');
  expect(json).toHaveProperty('timestamp');
  expect(json).toHaveProperty('checks');
  expect(json.checks).toHaveProperty('backend');
  expect(json.checks).toHaveProperty('memory');
});

test('Home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Yseeku|SONATE|Resonate/i);
});
