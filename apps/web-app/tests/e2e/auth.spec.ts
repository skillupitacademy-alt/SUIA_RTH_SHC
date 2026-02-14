import { test, expect } from '@playwright/test';
import { authFixtures, API_URL, UI_URL } from './fixtures/auth';
import { adminAuthFixtures } from '@admin-tests/fixtures/auth';

test.describe('Web App Auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    await authFixtures.clearState(page);
  });

  test('User Happy Path: Login -> Dashboard -> Logout', async ({ page }) => {
    await page.goto(`${UI_URL}/login`);
    await authFixtures.loginUser(page);
    await page.goto(`${UI_URL}/dashboard`);
    await expect(page).toHaveURL(/.*dashboard/);
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/.*login/);
    expect(await authFixtures.hasAuth(page)).toBeFalsy();
  });

  test('Cross-role isolation (User -> Admin)', async ({ page }) => {
    await authFixtures.loginUser(page);
    let cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'accessToken')).toBeTruthy();

    await page.goto(`${adminAuthFixtures.ADMIN_UI_URL}/login`);
    await adminAuthFixtures.loginAdmin(page);

    cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'accessToken')).toBeFalsy();
    expect(cookies.some((c) => c.name === 'admin_accessToken')).toBeTruthy();
  });

  test('Session Warning + Renew', async ({ page }) => {
    await authFixtures.loginUser(page);
    await page.goto(`${UI_URL}/dashboard`);
    await authFixtures.shortenSession(page);
    await page.reload();
    const modal = page.locator('text=Session Expiring');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Stay Logged In/i }).click();
    await expect(modal).toBeHidden();
    expect(await authFixtures.hasAuth(page)).toBeTruthy();
  });

  test('Session Auto-Logout', async ({ page }) => {
    await authFixtures.loginUser(page);
    await page.goto(`${UI_URL}/dashboard`);
    await page.route(`${API_URL}/api/auth/me`, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ session: { user: { id: 'mock' } }, expiresAt: new Date(Date.now() - 1000).toISOString() }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
    await page.reload();
    await expect(page).toHaveURL(/.*login/);
    expect(await authFixtures.hasAuth(page)).toBeFalsy();
  });

  test('Refresh Failure Recovery', async ({ page }) => {
    await authFixtures.loginUser(page);
    await page.goto(`${UI_URL}/dashboard`);
    await authFixtures.forceRefreshFail(page);
    await page.goto(`${UI_URL}/profile`);
    await expect(page).toHaveURL(/.*login/);
    expect(await authFixtures.hasAuth(page)).toBeFalsy();
  });

  test('Tab Close/Reopen: No Stale State', async ({ page, context }) => {
    await authFixtures.loginUser(page);
    await page.goto(`${UI_URL}/dashboard`);

    await context.close();

    const browser = page.context().browser();
    const newContext = await browser!.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto(`${UI_URL}/dashboard`);

    await expect(newPage).toHaveURL(/.*login/);
    await expect(await authFixtures.hasAuth(newPage)).toBeFalsy();
    await expect(newPage.getByText('Logout')).not.toBeVisible();
  });
});
