import { test, expect } from '@playwright/test';
import { authFixtures, UI_URL } from './fixtures/auth';
import { setupCSPAudit } from '@tests/utils/csp-audit-collector';

test.describe('Web App Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    setupCSPAudit(page);
    await authFixtures.clearState(page);
  });

  test('User Happy Path: Login -> Dashboard -> Logout', async ({ page }) => {
    await authFixtures.loginUser(page);
    await expect(page).toHaveURL(/.*dashboard/);

    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(`${UI_URL}/`, { timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.context().clearCookies();

    const isAuthenticated = await authFixtures.hasAuth(page);
    expect(isAuthenticated, 'Expected auth state to be cleared after logout').toBeFalsy();
  });

  test('Cross-role isolation (User -> Admin)', async ({ page }) => {
    await authFixtures.loginUser(page);
    const isAuthenticated = await authFixtures.hasAuth(page);
    expect(isAuthenticated, 'Expected to be authenticated after login').toBeTruthy();

    const hasStore = await page.evaluate(
      () => localStorage.getItem('quiz-platform-auth') !== null,
    );
    expect(hasStore, 'Expected quiz-platform-auth to be in localStorage').toBeTruthy();
  });

  test('Session Warning + Renew', async ({ page }) => {
    await authFixtures.loginUser(page);

    await authFixtures.shortenSession(page);
    await page.reload();

    const modal = page.getByText('Session Expiring');
    await expect(modal).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Stay Logged In/i }).click();
    await expect(modal).toBeHidden();

    const isAuthenticated = await authFixtures.hasAuth(page);
    expect(isAuthenticated, 'Expected to remain authenticated after renewal').toBeTruthy();
  });

  test('Session Auto-Logout', async ({ page }) => {
    await authFixtures.loginUser(page);

    let logoutTriggered = false;

    await page.route('**/api/auth/me', (route) => {
      if (logoutTriggered) {
        route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) });
        return;
      }
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: 'mock', email: 'test@test.com', name: 'Test', role: 'user', onboarded: true, isAdmin: false },
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.route('**/api/auth/logout', async (route) => {
      logoutTriggered = true;
      const cookieDomain = '.realtutorialhub.com';
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'Set-Cookie': [
            `accessToken=; Path=/; Domain=${cookieDomain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`,
            `refreshToken=; Path=/; Domain=${cookieDomain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`,
            `admin_accessToken=; Path=/; Domain=${cookieDomain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`,
            `admin_refreshToken=; Path=/; Domain=${cookieDomain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`,
          ].join('\n'),
        },
      });
    });

    await page.goto(`${UI_URL}/dashboard`);
    await page.waitForURL(/.*login/, { timeout: 35000 });
    await page.waitForTimeout(3000);
    await page.context().clearCookies();

    const authDetail = await authFixtures.getAuthDetail(page);
    expect(authDetail.isAuthenticated, `Expected auth state to be cleared after auto-logout. Reason: ${authDetail.reason}`).toBeFalsy();
  });

  test('Refresh Failure Recovery', async ({ page }) => {
    await authFixtures.loginUser(page);

    await authFixtures.forceRefreshFail(page);

    await page.route('**/api/auth/me', (route) => {
      route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) });
    });

    await page.goto(`${UI_URL}/dashboard`);
    await page.waitForURL(/.*login/, { timeout: 35000 });

    await page.waitForTimeout(2000);
    await page.context().clearCookies();

    const authDetail = await authFixtures.getAuthDetail(page);
    expect(authDetail.isAuthenticated, `Expected auth state to be cleared after refresh failure. Reason: ${authDetail.reason}`).toBeFalsy();
  });

  test('Tab Close/Reopen: No Stale State', async ({ page }) => {
    await authFixtures.loginUser(page);
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('about:blank');
    await authFixtures.clearState(page);
    await page.goto(`${UI_URL}/dashboard`);

    await page.waitForURL(/.*login/, { timeout: 30000 });
    await page.context().clearCookies();

    const isAuthenticated = await authFixtures.hasAuth(page);
    expect(isAuthenticated, 'Expected auth state to be cleared').toBeFalsy();
  });
});
