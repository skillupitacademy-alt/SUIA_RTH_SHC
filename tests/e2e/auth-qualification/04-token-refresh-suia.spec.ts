import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Token Refresh Flow Qualification', () => {
  test('AQ-04-SUIA: SUIA learner active refresh rotation, cookie update, and protected access', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, 'AQ-04-SUIA', [
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
      SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
    ]);

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);
    await auth.loginViaUI('/login', creds.email, creds.password);

    const cookiesBefore = await auth.context.cookies();
    const initialRefresh = cookiesBefore.find(c => c.name === 'refreshToken');
    const initialAccess = cookiesBefore.find(c => c.name === 'accessToken');
    expect(initialRefresh !== undefined, 'Initial refreshToken must exist').toBe(true);
    expect(initialAccess !== undefined, 'Initial accessToken must exist').toBe(true);

    // Call POST /api/auth/refresh directly using the active browser session
    const refreshRes = await auth.page.request.post('/api/auth/refresh');
    expect(refreshRes.status()).toBe(200);

    // Verify cookies updated in memory without leaking token values
    const cookiesAfter = await auth.context.cookies();
    const rotatedRefresh = cookiesAfter.find(c => c.name === 'refreshToken');
    const rotatedAccess = cookiesAfter.find(c => c.name === 'accessToken');
    expect(rotatedRefresh !== undefined, 'Rotated refreshToken must exist').toBe(true);
    expect(rotatedAccess !== undefined, 'Rotated accessToken must exist').toBe(true);

    const refreshRotated = rotatedRefresh!.value !== initialRefresh!.value;
    expect(refreshRotated, 'Refresh token value must change upon rotation').toBe(true);

    // Verify subsequent protected use with rotated session
    const meRes = await auth.page.request.get('/api/auth/me');
    expect(meRes.status()).toBe(200);
  });
});
