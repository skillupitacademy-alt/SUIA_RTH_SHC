import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieAbsent } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('RTH Logout and Post-Logout Session Contract', () => {
  test('AQ-05-RTH: RTH logout cookie clearance and refresh revocation contract', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'rth-chromium',
      projectOrigin: process.env.RTH_BASE_URL,
      disallowInLiveMode: true,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.RTH_LEARNER);
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify active session control before revocation using guarded API helper
    const activeCheck = await auth.apiGet('/api/auth/me');
    expect(activeCheck.status()).toBe(200);

    // Revoke token family via canonical session endpoint
    const logoutRes = await auth.apiDelete('/api/auth/sessions');
    expect(logoutRes.status()).toBe(200);

    // Subsequent refresh request must be rejected (401 Unauthorized) because DB tokens are revoked
    const postLogoutRefresh = await auth.apiPost('/api/auth/refresh');
    expect(postLogoutRefresh.status()).toBe(401);

    // Perform true UI logout action (fails explicitly if logout control is absent; never substitutes re-navigation)
    await auth.performLogout();

    const cookiesAfter = await auth.context.cookies();
    assertCookieAbsent(cookiesAfter, 'accessToken');
    assertCookieAbsent(cookiesAfter, 'refreshToken');
  });
});
