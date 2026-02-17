import { expect,test } from '@playwright/test';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

// Execution deferred: kept skipped until E2E phase is enabled.
test.describe.skip('Admin Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    void setupCSPAudit(page);
  });

  test('admin can reach login page', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002/login');
    await expect(page.locator('form')).toBeVisible();
  });
});
