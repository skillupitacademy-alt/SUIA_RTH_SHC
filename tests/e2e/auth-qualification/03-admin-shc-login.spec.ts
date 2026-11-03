import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites, assertCookieExists } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SHC Administrator Authentication Qualification', () => {
  test('AQ-03: SHC admin valid login and admin route protection', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.passwordEnvVar,
        'SKILLHUBCORE_DATABASE_URL',
      ],
      'SHC Administrator Journey'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SHC_ADMIN);

    // Navigate to SHC admin login page
    await auth.loginViaUI('/admin/login', creds.email, creds.password);

    // Verify redirection to admin dashboard
    await expect(auth.page).toHaveURL(/\/admin(\/|$)/, { timeout: 15000 });

    // Verify SHC cookies
    const cookies = await auth.context.cookies();
    await assertCookieExists(cookies, 'auth_token', { httpOnly: true });

    // Verify admin-only API access
    const adminCheck = await auth.page.request.get('/api/admin/metrics');
    // Expect 200 OK or appropriate admin response, strictly not 401/403
    expect([200, 204]).toContain(adminCheck.status());
  });
});
