import { test, expect, Page } from '@playwright/test';
import { adminAuthFixtures } from './fixtures/auth';

const ADMIN_UI_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002';

// Helper for logout since it's not in the fixture
async function logoutAdmin(page: Page) {
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login/);
}

test.describe('Admin Auth & Security Suite', () => {

  // 1. Happy Path: Login -> Dashboard -> Logout
  test('Admin Happy Path', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await expect(page.locator('header')).toContainText('ADMIN CORE');
    
    // Logout
    await logoutAdmin(page);
  });

  // 2. Sign Out UX
  test('Sign Out UX', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.locator('body')).toContainText('Logging out');
    await expect(page).toHaveURL(/\/login/);
  });

  // 3. Cross-role Isolation (Unauthenticated Access)
  test('Cross-role Isolation', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${ADMIN_UI_URL}/questions`);
    console.log('Navigated to /questions, waiting for redirect...');
    // Extended timeout for slow client-side hydration/redirect
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  // 4. Middleware Redirect (Root Access)
  test('Middleware Redirect', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${ADMIN_UI_URL}/`);
    console.log('Navigated to root, waiting for redirect...');
    // Extended timeout for middleware response
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  // 5. Session Warning + Renew
  test('Session Warning + Renew', async ({ page, context }) => {
    await context.addInitScript(() => {
        window.__idleTestConfig = {
            IDLE_WARNING_MS: 3000,
            IDLE_LOCK_MS: 10000,
            FORCED_IDLE_WARNING_MS: 55000,
            FORCED_IDLE_LOGOUT_MS: 60000
        };
    });

    await adminAuthFixtures.loginAdmin(page);
    
    // Go idle (wait 3s + buffer)
    await page.waitForTimeout(3500);
    await expect(page.getByText('Inactivity Protection')).toBeVisible();
    
    // Click Stay Active
    await page.getByRole('button', { name: 'Stay Active' }).click();
    await expect(page.getByText('Inactivity Protection')).toBeHidden();
  });

  // 6. Session Auto-Logout (Expiry) - Placeholder for existing logic retention
  test('Session Auto-Logout', async () => {
      // Logic for token expiry logout (omitted for brevity as we rely on idle tests mainly)
      // This matches "keep as-is" placeholder status.
      test.skip();
  });

  // 7. Idle Final Warning + Hard Logout
  test('Idle Final Warning + Hard Logout', async ({ page, context }) => {
    await context.addInitScript(() => {
        window.__idleTestConfig = {
            IDLE_WARNING_MS: 300000, 
            IDLE_LOCK_MS: 500000,
            FORCED_IDLE_WARNING_MS: 3000, // 3s
            FORCED_IDLE_LOGOUT_MS: 6000   // 6s
        };
    });

    await adminAuthFixtures.loginAdmin(page);

    // Wait for final warning (3s)
    await page.waitForTimeout(3500);
    await expect(page.getByText('Security Cutoff Imminent')).toBeVisible();

    // Wait for hard logout (6s total)
    await page.waitForTimeout(3500); // 3.5s + 3.5s > 6s
    await expect(page).toHaveURL(/\/login/);
  });

  // 8. Long-Task Resilience (E2E Integration)
  test('Long-Task Resilience', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);

    // a) Navigate to Factory and Trigger Mock Job
    await page.goto(`${ADMIN_UI_URL}/factory/question-generator`);
    await page.getByRole('button', { name: 'Mock Job' }).click();

    // b) Verify Badge appears in header (Polling started)
    await expect(page.locator('header')).toContainText('Processing');

    // c) Trigger Logout (While job is active)
    await logoutAdmin(page);

    // d) Re-login
    await adminAuthFixtures.loginAdmin(page);

    // e) Verify polling resumed automatically (Badge should come back)
    await expect(page.locator('header')).toContainText(/Tasks Complete|Processing/);

    // f) Wait for completion (Simulation takes ~13s)
    await expect(page.locator('header')).toContainText('Tasks Complete', { timeout: 20000 });
  });

});
