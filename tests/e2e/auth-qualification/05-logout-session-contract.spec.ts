import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieAbsent } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Logout and Post-Logout Session Contract', () => {
  test('AQ-05: Logout cookie clearance and refresh revocation contract', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-05', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Call DELETE /api/auth/sessions (canonical token revocation)
    const logoutRes = await auth.page.request.delete('/api/auth/sessions');
    expect(logoutRes.status()).toBe(200);

    // Subsequent refresh request must be rejected (401 Unauthorized) because DB tokens are revoked
    const postLogoutRefresh = await auth.page.request.post('/api/auth/refresh');
    expect(postLogoutRefresh.status()).toBe(401);

    // Perform GUI logout action to clear client-side browser cookies
    await auth.performLogout('/login');

    const cookiesAfter = await auth.context.cookies();
    assertCookieAbsent(cookiesAfter, 'accessToken');
    assertCookieAbsent(cookiesAfter, 'refreshToken');
  });
});
