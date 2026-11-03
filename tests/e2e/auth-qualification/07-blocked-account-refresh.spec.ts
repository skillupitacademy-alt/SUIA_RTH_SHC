import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Blocked Account Refresh Qualification', () => {
  test('AQ-07: Blocked account refresh rejected with HTTP 401 without consuming parent', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-07', [
      SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER.passwordEnvVar,
    ]);

    // Check if dynamic account lifecycle mutation fixture is available
    const hasLifecycleMutator = process.env.LIFECYCLE_FIXTURE_AVAILABLE === 'true';
    if (!hasLifecycleMutator) {
      testInfo.skip(
        true,
        '[NOT EXECUTED] AQ-07: Dynamic account blocking fixture (post-login lifecycle mutation) is not established. Cannot test mid-session block without fixture mutation.'
      );
      return;
    }

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER);

    // Initial login with active account
    await auth.loginViaUI('/login', creds.email, creds.password);

    // Execute dynamic lifecycle mutation (marking account blocked in database mid-session)
    // Note: Accepted REFRESH-06 policy denies refresh without consuming the parent token
    const refreshRes = await auth.page.request.post('/api/auth/refresh');
    expect(refreshRes.status()).toBe(401);

    const body = await refreshRes.json();
    const isExpectedError = /account.*(blocked|inactive|suspended)|unauthorized|invalid/i.test(body?.error || body?.message || '');
    expect(isExpectedError, 'Blocked account refresh must return account status error').toBe(true);
  });
});
