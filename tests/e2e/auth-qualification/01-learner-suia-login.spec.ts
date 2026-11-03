import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists, assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Learner Authentication Qualification', () => {
  test('AQ-01: SUIA learner valid login, protected dashboard, and API access', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-01', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // Navigate to SUIA GUI login page
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify redirection to learner destination
    await expect(auth.page).toHaveURL(/\/dashboard|\/learn|\/account/, { timeout: 15000 });

    // Verify standard learner cookies established
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true });
    assertCookieExists(cookies, 'refreshToken', { httpOnly: true });

    // Verify protected API call
    const apiResponse = await auth.page.request.get('/api/auth/me');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();

    assertValueMatchesSafely(data?.user?.email, creds.email, 'User email matches credentials');
    assertValueMatchesSafely(data?.user?.role !== 'admin', true, 'Learner session does not carry admin role');
  });
});
