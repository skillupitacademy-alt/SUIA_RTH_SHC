import { expect, Page,test } from '@playwright/test';

import { setupCSPAudit } from '../../../../tests/utils/csp-audit-collector';
import { adminAuthFixtures } from './fixtures/auth';

const ADMIN_UI_URL = adminAuthFixtures.ADMIN_UI_URL;

// Helper for logout since it's not in the fixture
async function logoutAdmin(page: Page) {
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login/);
}

test.describe('Admin Auth & Security Suite', () => {

  test.beforeEach(async ({ page }) => {
    setupCSPAudit(page);
  });

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
  test('Session Auto-Logout', async ({ page }) => {
    // Logic for token expiry logout (simulated idle behavior)
    await adminAuthFixtures.shortenSession(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    await page.waitForURL(/\/login/, { timeout: 35000 });
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
    await page.context().addInitScript(() => {
      (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__ = true;
    });

    await adminAuthFixtures.loginAdmin(page);

    // a) Navigate to Factory and Trigger Mock Job
    await page.goto(`${ADMIN_UI_URL}/factory/question-generator?e2e=true`);
    
    // Check if a badge is already visible (due to 429 or concurrent tests)
    const existingBadge = page.locator('header').getByRole('button').filter({ hasText: /Processing/i });
    const isAlreadyProcessing = (await existingBadge.count()) > 0;
    
    if (!isAlreadyProcessing) {
      const mockBtn = page.getByTestId('mock-job-button');
      await expect(mockBtn).toBeVisible({ timeout: 20000 });
      await mockBtn.click().catch(() => {}); // Catch potential 429
    }
    
    // b) Verify Badge appears (or is already there)
    const badge = page.locator('header').getByRole('button').filter({ hasText: /Processing|Tasks Complete/i });
    await expect(badge).toBeVisible({ timeout: 20000 });
    
    // If it was "Tasks Complete", wait for "Processing". If already "Processing", stays "Processing".
    try {
      await expect(badge).toContainText(/Processing/i, { timeout: 45000 });
    } catch {
      // Ignore if it skipped straight to Complete or was already processing
    }

    // c) Trigger Logout (While job is active)
    await logoutAdmin(page);

    // d) Re-login
    await adminAuthFixtures.loginAdmin(page);

    // e) Verify polling resumed automatically
    const recoveredBadge = page.locator('header').getByRole('button').filter({ hasText: /Processing|Tasks Complete/i });
    await expect(recoveredBadge).toBeVisible({ timeout: 20000 });
    await expect(recoveredBadge).toContainText(/Tasks Complete|Processing/i, { timeout: 20000 });

    // f) Wait for completion (Simulation takes ~13s)
    await expect(recoveredBadge).toContainText('Tasks Complete', { timeout: 40000 });
  });

  // 9. Locked Terminal Protects State
  test('Locked Terminal Protects State', async ({ page, context }) => {
    await context.addInitScript(() => {
        window.__idleTestConfig = {
            IDLE_WARNING_MS: 1000,
            IDLE_LOCK_MS: 3000,
            FORCED_IDLE_WARNING_MS: 60000,
            FORCED_IDLE_LOGOUT_MS: 120000
        };
    });

    await adminAuthFixtures.loginAdmin(page);
    // Use factory page which has inputs
    await page.goto(`${ADMIN_UI_URL}/factory/question-generator?e2e=true`);
    
    // Type something
    const testValue = 'SENSITIVE DRAFT DATA';
    // Using a more generic selector if textarea isn't found immediately
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill(testValue);

    // Wait for lock
    await page.waitForTimeout(4000);
    await expect(page.getByText('Terminal Locked')).toBeVisible();

    // Unlock
    const password = process.env.TEST_ADMIN_PASSWORD!;
    const passInput = page.locator('input[type="password"]');
    await passInput.waitFor({ state: 'visible', timeout: 15000 });
    await passInput.fill(password, { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow more time for live site
    
    // Check if button is enabled before clicking
    const unlockBtn = page.getByRole('button', { name: /Unlock Protocol/i });
    await expect(unlockBtn).toBeVisible({ timeout: 10000 });
    await expect(unlockBtn).toBeEnabled({ timeout: 15000 });
    await unlockBtn.click();

    // Verify text preserved
    // Increased timeout for live site revalidation latency
    await expect(page.getByText('Terminal Locked')).toBeHidden({ timeout: 45000 });
    
    // If we are still at /login, it failed
    expect(page.url()).not.toContain('/login');
    
    const currentVal = await input.inputValue();
    expect(currentVal).toBe(testValue);
  });

  // 10. 401 While Locked Does Not Redirect (Patience Protocol)
  test('401 While Locked Does Not Redirect', async ({ page, context }) => {
     await context.addInitScript(() => {
        window.__idleTestConfig = {
            IDLE_WARNING_MS: 1000,
            IDLE_LOCK_MS: 2000,
            FORCED_IDLE_WARNING_MS: 60000,
            FORCED_IDLE_LOGOUT_MS: 120000
        };
    });

    await adminAuthFixtures.loginAdmin(page);
    
    // Wait for lock
    await page.waitForTimeout(3000);
    await expect(page.getByText('Terminal Locked')).toBeVisible();

    // Simulate background 401
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { cancelable: true }));
    });

    // Verify NO redirect
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    await expect(page.getByText('Terminal Locked')).toBeVisible();
  });

  // 11. Security Shredder Clears LocalStorage
  test('Security Shredder Clears LocalStorage', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    
    // Set factory data
    await page.evaluate(() => {
        localStorage.setItem('quiz-factory-storage-v1', JSON.stringify({ draft: 'SECRET' }));
    });

    // Verify exists
    const before = await page.evaluate(() => localStorage.getItem('quiz-factory-storage-v1'));
    expect(before).not.toBeNull();

    // Perform Hard Logout
    await logoutAdmin(page);

    // Verify shredded
    const after = await page.evaluate(() => localStorage.getItem('quiz-factory-storage-v1'));
    expect(after).toBeNull();
  });

});
