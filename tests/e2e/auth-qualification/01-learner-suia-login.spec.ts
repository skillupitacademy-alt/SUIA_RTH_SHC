import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists, assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Learner Authentication Qualification', () => {
  test('AQ-01: SUIA learner valid login, protected dashboard, and API access', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'suia-chromium',
      projectOrigin: process.env.SUIA_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // Navigate to SUIA GUI login page
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify redirection to learner destination
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/learn|\/account/, { timeout: 30000 });

    // Verify standard learner cookies established
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true });
    assertCookieExists(cookies, 'refreshToken', { httpOnly: true });

    // Verify protected API call using guarded API helper
    const apiResponse = await auth.apiGet('/api/profile');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();

    assertValueMatchesSafely(data?.email, creds.email, 'User email matches credentials');
  });
});
