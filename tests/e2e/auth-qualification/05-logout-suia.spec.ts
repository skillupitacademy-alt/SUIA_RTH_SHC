import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieAbsent } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Logout and Post-Logout Session Contract', () => {
  test('AQ-05-SUIA: SUIA logout cookie clearance and refresh revocation contract', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-05-SUIA', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify active session control before revocation
    const activeCheck = await auth.page.request.get('/api/auth/me');
    expect(activeCheck.status()).toBe(200);

    // Revoke token family via canonical session endpoint
    const logoutRes = await auth.page.request.delete('/api/auth/sessions');
    expect(logoutRes.status()).toBe(200);

    // Subsequent refresh request must be rejected (401 Unauthorized) because DB tokens are revoked
    const postLogoutRefresh = await auth.page.request.post('/api/auth/refresh');
    expect(postLogoutRefresh.status()).toBe(401);

    // Perform true UI logout action (fails explicitly if logout control is absent; never substitutes re-navigation)
    await auth.performLogout();

    const cookiesAfter = await auth.context.cookies();
    assertCookieAbsent(cookiesAfter, 'accessToken');
    assertCookieAbsent(cookiesAfter, 'refreshToken');
  });
});
