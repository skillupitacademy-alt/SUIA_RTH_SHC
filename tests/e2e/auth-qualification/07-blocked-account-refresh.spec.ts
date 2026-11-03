import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Blocked Account Refresh Qualification', () => {
  test('AQ-07: Blocked account refresh rejected with HTTP 401', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'Controlled Blocked Account Fixture'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.BLOCKED_LEARNER);

    // Initial login or pre-seeded session
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // Call POST /api/auth/refresh for account in BLOCKED status
    const refreshRes = await auth.page.request.post('/api/auth/refresh');

    // REFRESH-06 contract: blocked account must return HTTP 401 and revoke active session
    expect(refreshRes.status()).toBe(401);

    const body = await refreshRes.json();
    expect(body.error).toMatch(/account.*(blocked|inactive|suspended)|unauthorized/i);
  });
});
