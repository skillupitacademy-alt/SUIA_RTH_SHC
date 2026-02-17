import { test, expect } from '@playwright/test';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

// Execution deferred: kept skipped until E2E phase is enabled.
test.describe('Web App Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    setupCSPAudit(page);
  });

  test('user can open login page', async ({ page }) => {
    await page.goto(`${process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'http://localhost:3001'}/login`);
    const form = page.locator('form');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await Promise.race([form.first().waitFor({ state: 'visible', timeout: 10000 }), emailInput.waitFor({ state: 'visible', timeout: 10000 })]);
    await expect(page).toHaveURL(/login|dashboard/);
  });
});
