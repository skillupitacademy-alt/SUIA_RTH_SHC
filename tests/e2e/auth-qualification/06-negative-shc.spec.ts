import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieAbsent } from './helpers/sanitized-evidence';

test.describe('SHC Negative Authentication Qualification', () => {
  test('AQ-06-SHC: Invalid credentials rejection and zero-cookie state on SHC', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'shc-chromium',
      projectOrigin: process.env.SHC_BASE_URL,
    });

    // Attempt login with invalid credentials on /login
    await auth.page.goto('/login', { waitUntil: 'domcontentloaded' });

    const emailInput = auth.page.locator('input[type="email"], input[name="email"], input#email').first();
    const passInput = auth.page.locator('input[type="password"], input[name="password"], input#password').first();
    const submitBtn = auth.page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();

    await emailInput.fill('invalid-admin@skillhubcore.invalid');
    await passInput.fill('InvalidPassword!999');
    await submitBtn.click();

    // Verify error feedback is visible
    const errorAlert = auth.page.locator('[role="alert"], .text-destructive, .error-message, text=/invalid|failed|incorrect/i').first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // Verify URL did NOT navigate to /admin
    expect(auth.page.url()).not.toContain('/admin');

    // Verify NO authentication cookies were set
    const cookies = await auth.context.cookies();
    assertCookieAbsent(cookies, 'accessToken');
    assertCookieAbsent(cookies, 'refreshToken');
    assertCookieAbsent(cookies, 'admin_accessToken');
    assertCookieAbsent(cookies, 'admin_refreshToken');
  });
});
