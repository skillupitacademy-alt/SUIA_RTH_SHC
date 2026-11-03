import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites, assertCookieExists } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('RTH Learner Authentication Qualification', () => {
  test('AQ-02: RTH learner valid login, protected dashboard, and API access', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.passwordEnvVar,
        'DATABASE_URL_RTH',
      ],
      'RTH Learner Login Journey'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.RTH_LEARNER);

    // Navigate to RTH login page
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // Verify redirection to RTH learner area
    await expect(auth.page).toHaveURL(/\/dashboard|\/tutorials|\/account/, { timeout: 15000 });

    // Verify session cookies established
    const cookies = await auth.context.cookies();
    await assertCookieExists(cookies, 'auth_token', { httpOnly: true });

    // Verify protected user endpoint
    const apiResponse = await auth.page.request.get('/api/auth/me');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(creds.email);
  });
});
