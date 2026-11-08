import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieAbsent } from './helpers/sanitized-evidence';

test.describe('SUIA Negative Authentication Qualification', () => {
  test('AQ-06-SUIA: Invalid credentials rejection and zero-cookie state on SUIA', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'suia-chromium',
      projectOrigin: process.env.SUIA_BASE_URL,
    });

    // Attempt login with invalid credentials on /login via UI helper
    await auth.loginViaUI('/login', 'invalid-learner@skillup.invalid', 'InvalidPassword!999');

    // Verify error feedback is visible
    const errorAlert = auth.page.locator('.text-red-700, [role="alert"]').filter({ hasText: /invalid|failed|incorrect/i }).first();
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Verify URL did NOT navigate to dashboard
    expect(auth.page.url()).toContain('/login');

    // Verify NO authentication cookies were set
    const cookies = await auth.context.cookies();
    assertCookieAbsent(cookies, 'accessToken');
    assertCookieAbsent(cookies, 'refreshToken');
    assertCookieAbsent(cookies, 'admin_accessToken');
    assertCookieAbsent(cookies, 'admin_refreshToken');
  });
});
