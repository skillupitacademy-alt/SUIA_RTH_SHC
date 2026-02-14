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
    await expect(page).toHaveURL(/login/);
    expect(await adminAuthFixtures.hasAuth(page)).toBeFalsy();
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
    await expect(page).toHaveURL(/login/);
    expect(await adminAuthFixtures.hasAuth(page)).toBeFalsy();
  });

  test('Cross-role isolation (Admin -> User)', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    let cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'admin_accessToken')).toBeTruthy();

    await page.goto(`${USER_UI_URL}/login`);
    await authFixtures.loginUser(page);

    cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'admin_accessToken')).toBeFalsy();
    expect(cookies.some((c) => c.name === 'accessToken')).toBeTruthy();
  });

  test('Middleware redirect when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${ADMIN_UI_URL}/`);
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('Session Warning + Renew', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    await adminAuthFixtures.shortenSession(page);
    await page.reload();
    const modal = page.locator('text=Session Expiring');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Stay Logged In/i }).click();
    await expect(modal).toBeHidden();
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
    await expect(page).toHaveURL(/login/);
    expect(await adminAuthFixtures.hasAuth(page)).toBeFalsy();
  });

  test('Refresh Failure Recovery', async ({ page }) => {
    await adminAuthFixtures.loginAdmin(page);
    await page.goto(`${ADMIN_UI_URL}/`);
    await adminAuthFixtures.forceRefreshFail(page);
    await page.goto(`${ADMIN_UI_URL}/users`);
    await expect(page).toHaveURL(/login/);
    expect(await adminAuthFixtures.hasAuth(page)).toBeFalsy();
  });
});
