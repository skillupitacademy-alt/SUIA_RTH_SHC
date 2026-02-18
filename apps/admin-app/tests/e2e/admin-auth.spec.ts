import { expect, test } from '@playwright/test';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

// Execution deferred: kept skipped until E2E phase is enabled.
test.describe('Admin Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    void setupCSPAudit(page);
  });

  test('admin can reach login page', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('shows error for short password', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002/login');
    await page.fill('input[type="email"]', 'ajayshah@gmail.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // The browser might block submission due to minLength={8}, 
    // but if it hits the API, we expect the error message from the backend.
    // If browser blocks it, we check for validation state.
    const passwordInput = page.locator('input[type="password"]');
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    
    if (isInvalid) {
        // Validation handled by browser minLength
        expect(isInvalid).toBe(true);
    } else {
        // If it submitted, check for the error message from backend
        // (Wait for the API response)
        await expect(page.locator('text=String must contain at least 8 character(s)')).toBeVisible();
    }
  });
});
