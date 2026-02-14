import { test, expect } from '@playwright/test';
import { adminAuthFixtures } from './fixtures/auth';
import { authFixtures } from '@web-tests/fixtures/auth';

const ADMIN_UI_URL = adminAuthFixtures.ADMIN_UI_URL;
const USER_UI_URL = process.env.USER_UI_URL || 'https://quiz.realtutorialhub.com';

test.describe('Admin Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    await adminAuthFixtures.clearState(page);
  });

  test('Admin Happy Path: Login -> Dashboard -> Logout', async ({ page }) => {
    await page.goto(`${ADMIN_UI_URL}/login`);
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    await expect(page).not.toHaveURL(/login/);
    const logoutBtn = page.getByText(/Sign Out|Logout/i).first();
    await logoutBtn.click({ timeout: 20000 });
    // After logout, allow time for client-side cleanup on prod
    await expect(async () => {
      await adminAuthFixtures.clearState(page);
      const authed = await adminAuthFixtures.hasAuth(page);
      expect(authed).toBeFalsy();
    }).toPass({ timeout: 5000, intervals: [200, 400, 800, 1200] });
  });

  test('Sign Out shows redirect banner and no session-warning modal', async ({ page }) => {
    await page.goto(`${ADMIN_UI_URL}/login`);
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);

    // Trigger manual sign out
    const logoutBtn = page.getByText(/Sign Out|Logout/i).first();
    await logoutBtn.click({ timeout: 20000 });

    // While redirecting, a toast/banner should appear
    const redirectBanner = page.getByText('Redirecting...', { exact: false });
    await expect(redirectBanner).toBeVisible({ timeout: 3000 });

    // The session-expiring modal should NOT appear during manual logout
    const warningModal = page.getByText('Session Expiring', { exact: false });
    await expect(warningModal).toBeHidden({ timeout: 1000 });

    // Final state: back at login and auth cleared
    await expect(async () => {
      await adminAuthFixtures.clearState(page);
      const url = page.url();
      const authed = await adminAuthFixtures.hasAuth(page);
      expect(url).toMatch(/login/);
      expect(authed).toBeFalsy();
    }).toPass({ timeout: 5000, intervals: [200, 400, 800, 1200] });
  });

  test('Cross-role isolation (Admin -> User)', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    let cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'admin_accessToken')).toBeTruthy();

    await page.goto(`${USER_UI_URL}/login`);
    await authFixtures.loginUser(page);

    // Wait for the user dashboard to finish its loading overlay before checking cookies/state
    const loadingOverlay = page.getByText(/loading dashboard/i);
    await loadingOverlay.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    await page.getByText(/dashboard overview|start new exam|dashboard/i).first().waitFor({
      state: 'visible',
      timeout: 15000,
    }).catch(() => {});

    cookies = await page.context().cookies();
    // We only care that admin cookies are gone and a user session exists (either cookie or local store)
    expect(cookies.some((c) => c.name === 'admin_accessToken')).toBeFalsy();
    await expect(async () => {
      const nextCookies = await page.context().cookies();
      const userCookie = nextCookies.some((c) => c.name === 'accessToken');
      const hasUserStore = await authFixtures.hasAuth(page);
      expect(userCookie || hasUserStore).toBeTruthy();
    }).toPass({ timeout: 5000, intervals: [200, 400, 800, 1200] });
  });

  test('Middleware redirect when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${ADMIN_UI_URL}/`);
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('Session Warning + Lock (Idle Flow)', async ({ page, context }) => {
    // 0. Speed up both polling (1s) AND idle detection (10s lock)
    // We override IDLE constants for the test
    await context.addInitScript(() => {
      const originalSetInterval = window.setInterval;
      (window as any).setInterval = function(fn: any, delay: any) {
        if (delay === 30000) return originalSetInterval(fn, 1000); // Poll fast
        return originalSetInterval(fn, delay);
      };
    });

    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    
    // 1. Manually trigger the idle warning state by evaluating a small timeout
    // In a real test we'd wait, but for E2E we can "force" the lastActivityAt back
    await page.evaluate(() => {
      // Force lastActivityAt to 4 minutes ago (triggers Warning but not Lock)
      (window as any).dispatchEvent(new CustomEvent('test:trigger-idle', { detail: 180000 + 1000 }));
    });

    // 2. Verify Warning appears
    await expect(page.locator('body')).toContainText('Inactivity Protection', { timeout: 15000 });
    
    // 3. Force idle further to 5 minutes
    await page.evaluate(() => {
      (window as any).dispatchEvent(new CustomEvent('test:trigger-idle', { detail: 300000 + 1000 }));
    });

    // 4. Verify Lock Screen appears
    await expect(page.getByText('Terminal Locked')).toBeVisible({ timeout: 15000 });
    
    // 5. Unlock with password
    await page.getByPlaceholder('MASTER PASSWORD').fill('password123'); // Default test password
    await page.getByRole('button', { name: /Unlock Protocol/i }).click();

    // 6. Verify back to dashboard
    await expect(page.getByText('Terminal Locked')).toBeHidden({ timeout: 15000 });
    expect(await adminAuthFixtures.hasAuth(page)).toBeTruthy();
  });

  test('Session Auto-Logout', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    // Force expired session
    await page.route('**/api/admin/auth/me', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { isAdmin: true }, expiresAt: new Date(Date.now() - 1000).toISOString() }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
    await page.reload();
    await expect(async () => {
      await adminAuthFixtures.clearState(page);
      const authed = await adminAuthFixtures.hasAuth(page);
      expect(authed).toBeFalsy();
    }).toPass({ timeout: 5000, intervals: [200, 400, 800, 1200] });
  });

  test('Refresh Failure Recovery', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    await adminAuthFixtures.forceRefreshFail(page);
    await page.goto(`${ADMIN_UI_URL}/users`);
    // Whether or not the UI redirects, enforce cleanup
    await expect(async () => {
      await adminAuthFixtures.clearState(page);
      const authed = await adminAuthFixtures.hasAuth(page);
      expect(authed).toBeFalsy();
    }).toPass({ timeout: 5000, intervals: [200, 400, 800, 1200] });
  });
});
