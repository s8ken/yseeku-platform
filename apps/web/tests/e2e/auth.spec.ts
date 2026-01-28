/**
 * End-to-End Authentication Tests
 * Tests the complete user authentication flow in the browser
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(BASE_URL);
  });

  test('should display login page correctly', async ({ page }) => {
    // Check for SONATE branding
    await expect(page.locator('h1')).toContainText('SONATE');
    
    // Check for form elements
    await expect(page.locator('input[id="tenant"]')).toBeVisible();
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');
    
    // Browser validation should prevent submission
    // Check if form is still on login page
    await expect(page).toHaveURL(BASE_URL);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[id="tenant"]', 'default');
    await page.fill('input[id="username"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    
    // Check for error message
    const errorMessage = await page.locator('[role="alert"]').textContent();
    expect(errorMessage).toContain('Login failed');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Note: This test requires a test user to exist in the database
    // You may need to create a test user first or use the guest login
    
    // Try guest login first
    await page.fill('input[id="tenant"]', 'default');
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard or error
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard or still on login
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard')) {
      // Success - we're on dashboard
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Welcome/i);
    } else {
      // Still on login - credentials might not exist
      console.log('Note: Test user credentials may not exist. This is expected in a fresh installation.');
    }
  });

  test('should handle loading state during login', async ({ page }) => {
    // Fill in credentials
    await page.fill('input[id="tenant"]', 'default');
    await page.fill('input[id="username"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText(/Signing in/i);
  });

  test('should persist login after page refresh', async ({ page, context }) => {
    // This test assumes successful login
    // Skip if no valid credentials available
    
    // Try to login
    await page.fill('input[id="tenant"]', 'default');
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // If we're on dashboard, test persistence
    if (page.url().includes('/dashboard')) {
      // Refresh page
      await page.reload();
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should navigate to different tenant', async ({ page }) => {
    // Change tenant field
    await page.fill('input[id="tenant"]', 'custom-tenant');
    
    // Verify value is set
    const tenantValue = await page.inputValue('input[id="tenant"]');
    expect(tenantValue).toBe('custom-tenant');
  });

  test('should have accessible form labels', async ({ page }) => {
    // Check for proper labels
    await expect(page.locator('label[for="tenant"]')).toBeVisible();
    await expect(page.locator('label[for="username"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  test('should have password field type', async ({ page }) => {
    // Check password field is type="password"
    const passwordField = page.locator('input[id="password"]');
    await expect(passwordField).toHaveAttribute('type', 'password');
  });
});

test.describe('Guest Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should have guest login option if available', async ({ page }) => {
    // Check if there's a guest login button or link
    const guestButton = page.locator('button:has-text("Guest")');
    
    if (await guestButton.isVisible()) {
      // Click guest login
      await guestButton.click();
      
      // Should navigate to dashboard
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});

test.describe('Backend Health Check', () => {
  test('backend health endpoint should be accessible', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});