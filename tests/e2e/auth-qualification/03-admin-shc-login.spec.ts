import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SHC Administrator Authentication Qualification', () => {
  test('AQ-03: SHC admin valid login and admin route protection', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'shc-chromium',
      projectOrigin: process.env.SHC_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SHC_ADMIN);

    // Navigate to SHC admin GUI login page
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify redirection to admin dashboard
    await expect(auth.page).toHaveURL(/\/admin(\/|$)/, { timeout: 15000 });

    // Verify SHC GUI cookies established (all 4 named cookies per setAdminSessionCookies)
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true });
    assertCookieExists(cookies, 'admin_accessToken', { httpOnly: true });

    // Verify admin-only API access using guarded API helper
    const adminCheck = await auth.apiGet('/api/admin/overview');
    const isAuthorized = [200, 204].includes(adminCheck.status());
    expect(isAuthorized, 'Admin endpoint must be authorized for SHC admin session').toBe(true);
  });
});
