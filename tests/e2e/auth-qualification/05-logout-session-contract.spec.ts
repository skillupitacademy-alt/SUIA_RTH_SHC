import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites, assertCookieAbsent } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Logout and Post-Logout Session Contract', () => {
  test('AQ-05: Logout cookie clearance and refresh revocation contract', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'Logout Contract'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // Call DELETE /api/auth/sessions (canonical logout)
    const logoutRes = await auth.page.request.delete('/api/auth/sessions');
    expect(logoutRes.status()).toBe(200);

    // Verify session cookies removed or zeroed
    const cookiesAfter = await auth.context.cookies();
    const tokenCookie = cookiesAfter.find(c => c.name === 'auth_token');
    const refreshCookie = cookiesAfter.find(c => c.name === 'refresh_token_skillup');

    // Either removed or set with maxAge <= 0 / empty value
    if (tokenCookie) {
      expect(tokenCookie.value).toBe('');
    }
    if (refreshCookie) {
      expect(refreshCookie.value).toBe('');
    }

    // Subsequent refresh request must be rejected (401 Unauthorized)
    const postLogoutRefresh = await auth.page.request.post('/api/auth/refresh');
    expect(postLogoutRefresh.status()).toBe(401);
  });
});
