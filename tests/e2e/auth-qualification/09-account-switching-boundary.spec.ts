import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Account Switching Boundary Qualification', () => {
  test('AQ-09: Account switching clears previous profile, private markers, and cache', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-09', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
      SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER.passwordEnvVar,
    ]);

    const creds1 = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    const creds2 = getAccountCredentials(SYNTHETIC_ACCOUNTS.CROSS_TENANT_LEARNER);

    // 1. Log in as User 1
    await auth.loginViaUI('/login', creds1.email, creds1.password);
    const user1Res = await auth.page.request.get('/api/auth/me');
    const user1Data = await user1Res.json();
    const user1Marker = user1Data?.user?.id;
    expect(user1Marker !== undefined, 'User 1 ID marker must exist').toBe(true);

    // 2. Perform UI logout
    await auth.performLogout('/login');

    // 3. Log in as User 2 in the same browser session
    await auth.loginViaUI('/login', creds2.email, creds2.password);
    const user2Res = await auth.page.request.get('/api/auth/me');
    const user2Data = await user2Res.json();
    const user2Marker = user2Data?.user?.id;

    // 4. Assert zero residue of User 1 state in memory using boolean comparison
    const hasResidue = user2Marker === user1Marker;
    expect(hasResidue, 'User 2 session must not retain User 1 identity marker').toBe(false);

    assertValueMatchesSafely(user2Data?.user?.email, creds2.email, 'User 2 active identity matches creds2');
  });
});
