import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SHC Administrator Authentication Qualification', () => {
  test('AQ-03: SHC admin unauthenticated 401 control, valid GUI login, and authenticated route access', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'shc-chromium',
      projectOrigin: process.env.SHC_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SHC_ADMIN);

    // 1. Unauthenticated control check: verify /api/admin/auth/me rejects unauthenticated request with HTTP 401
    const unauthenticatedCheck = await auth.apiGet('/api/admin/auth/me');
    expect(
      unauthenticatedCheck.status(),
      'Protected admin endpoint must reject unauthenticated access with HTTP 401'
    ).toBe(401);
    const unauthContentType = unauthenticatedCheck.headers()['content-type'] || '';
    expect(
      unauthContentType.includes('application/json'),
      'Unauthenticated response must return JSON error rather than HTML redirect page'
    ).toBe(true);

    // 2. Navigate to SHC admin GUI login page and log in via UI
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 3. Verify redirection to admin area (/dashboard or /admin) per SHC router
    await expect(auth.page).toHaveURL(/\/dashboard|\/admin(\/|$)/, { timeout: 15000 });

    // 4. Verify SHC GUI cookies established (all named cookies per setAdminSessionCookies)
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true });
    assertCookieExists(cookies, 'admin_accessToken', { httpOnly: true });

    // 5. Authenticated control check: verify /api/admin/auth/me allows authorized admin session
    const authenticatedCheck = await auth.apiGet('/api/admin/auth/me');
    const isAuthorized = [200, 204].includes(authenticatedCheck.status());
    expect(
      isAuthorized,
      `Protected admin endpoint must be authorized for SHC admin session (received ${authenticatedCheck.status()})`
    ).toBe(true);
  });
});
