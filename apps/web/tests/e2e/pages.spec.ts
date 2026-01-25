import { test, expect } from '@playwright/test';

test('Dashboard Overview page renders', async ({ page }) => {
  await page.goto('/dashboard/overview');
  await expect(page.locator('body')).toBeVisible();
});

test('Proof page renders', async ({ page }) => {
  await page.goto('/proof');
  await expect(page.locator('body')).toBeVisible();
});


test('Resonance explain API works', async ({ request }) => {
  const res = await request.post('/api/detect/resonance/explain', {
    data: { userInput: 'Hello', aiResponse: 'Hi there!', history: [] }
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json).toHaveProperty('r_m');
  expect(json).toHaveProperty('explanation');
});
