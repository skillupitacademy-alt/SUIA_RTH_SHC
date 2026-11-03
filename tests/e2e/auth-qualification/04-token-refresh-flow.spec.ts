import { test, expect } from './fixtures/auth.fixtures';
import { requirePrerequisites } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('Token Refresh Flow Qualification', () => {
  test('AQ-04A: SUIA/RTH active refresh rotation and cookie update', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
        'DATABASE_URL_SKILLUP',
      ],
      'SUIA Token Refresh Flow'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/auth/login', creds.email, creds.password);

    // Call POST /api/auth/refresh directly using the active browser session
    const refreshRes = await auth.page.request.post('/api/auth/refresh');
    expect(refreshRes.status()).toBe(200);

    const body = await refreshRes.json();
    expect(body.success).toBe(true);

    // Check that refreshed cookies are set
    const cookiesAfter = await auth.context.cookies();
    const refreshCookie = cookiesAfter.find(c => c.name === 'refresh_token_skillup');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.httpOnly).toBe(true);
  });

  test('AQ-04B: SHC refresh capability gap documentation', async ({ auth }, testInfo) => {
    requirePrerequisites(
      testInfo,
      [
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.passwordEnvVar,
        'SKILLHUBCORE_DATABASE_URL',
      ],
      'SHC Refresh Flow Gap'
    );

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SHC_ADMIN);
    await auth.loginViaUI('/admin/login', creds.email, creds.password);

    // Verify that SHC admin session does NOT provide refresh_token_skillhubcore cookie
    const cookies = await auth.context.cookies();
    const shcRefresh = cookies.find(c => c.name === 'refresh_token_skillhubcore');
    // As documented in GUARD-02, SHC admin sessions are purely 8-hour stateless JWTs without refresh cookie
    expect(shcRefresh).toBeUndefined();
  });
});
