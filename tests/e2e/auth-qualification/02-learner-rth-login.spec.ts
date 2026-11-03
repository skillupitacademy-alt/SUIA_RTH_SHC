import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists, assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('RTH Learner Authentication Qualification', () => {
  test('AQ-02: RTH learner valid login, protected dashboard, and API access', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'rth-chromium',
      projectOrigin: process.env.RTH_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.RTH_LEARNER);

    // Navigate to RTH GUI login page
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Verify redirection to RTH learner area
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/tutorials|\/account|\/learn/, { timeout: 30000 });

    // Verify standard learner cookies established
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true });
    assertCookieExists(cookies, 'refreshToken', { httpOnly: true });

    // Verify protected user endpoint using guarded API helper
    const apiResponse = await auth.apiGet('/api/profile');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();

    assertValueMatchesSafely(data?.email, creds.email, 'User email matches credentials');
  });
});
