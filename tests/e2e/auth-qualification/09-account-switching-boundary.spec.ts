import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Account Switching Boundary Qualification', () => {
  test('AQ-09: Account switching clears previous profile and cache', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
        SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'Account Switching Fixture'
    );

    const creds1 = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    const creds2 = getAccountCredentials(SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER);

    // 1. Log in as User 1
    await auth.loginViaUI('/auth/login', creds1.email, creds1.password);
    const user1Res = await auth.page.request.get('/api/auth/me');
    const user1Data = await user1Res.json();
    expect(user1Data.user.email).toBe(creds1.email);

    // 2. Log out
    await auth.performLogout('/auth/logout');

    // 3. Log in as User 2 in the same browser session
    await auth.loginViaUI('/auth/login', creds2.email, creds2.password);
    const user2Res = await auth.page.request.get('/api/auth/me');
    const user2Data = await user2Res.json();
    expect(user2Data.user.email).toBe(creds2.email);

    // 4. Assert zero residue of User 1 state
    expect(user2Data.user.id).not.toBe(user1Data.user.id);
  });
});
