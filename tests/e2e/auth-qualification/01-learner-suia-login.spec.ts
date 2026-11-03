import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites, assertCookieExists } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Learner Authentication Qualification', () => {
  test('AQ-01: SUIA learner valid login, protected dashboard, and API access', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'SUIA Learner Login Journey'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // Navigate to SUIA login page
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // Verify successful redirection to learner dashboard
    await expect(auth.page).toHaveURL(/\/dashboard|\/learn|\/account/, { timeout: 15000 });

    // Verify session cookies established
    const cookies = await auth.context.cookies();
    await assertCookieExists(cookies, 'auth_token', { httpOnly: true });

    // Verify protected API call with session cookie
    const apiResponse = await auth.page.request.get('/api/auth/me');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(creds.email);
    expect(data.user.role).not.toBe('admin');
  });
});
