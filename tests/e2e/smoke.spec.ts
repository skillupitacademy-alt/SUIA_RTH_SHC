import { test, expect } from '@playwright/test';

test.describe('Smoke Test: Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    // Adjust this expectation based on actual home page title or content
    await expect(page).toHaveTitle(/Quiz/);
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
