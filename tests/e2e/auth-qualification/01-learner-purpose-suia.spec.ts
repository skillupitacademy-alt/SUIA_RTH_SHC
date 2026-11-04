import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import {
  assertCookieExists,
  assertCookieAbsent,
  assertValueMatchesSafely,
} from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

/**
 * In-memory JWT payload extractor.
 * Strictly decodes the JSON payload from the token middle segment without logging or exposing secrets.
 */
function parseJwtPayloadInMemory(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('[MEMORY_AUTH] Token does not have three segments');
  }
  const jsonStr = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(jsonStr);
}

test.describe('SUIA Learner-Purpose Browser Smoke Qualification', () => {
  test('AQ-01: SUIA learner GUI login, purpose token claims, and profile verification', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'suia-chromium',
      projectOrigin: process.env.SUIA_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // 1. Fresh headless Chromium context: log in through the actual SUIA GUI on local origin
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 2. Observe post-login destination URL
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/learn|\/account/, { timeout: 30000 });
    const landedUrl = auth.page.url();
    const destinationPath = new URL(landedUrl).pathname;
    const isOnboarding = destinationPath.includes('/onboarding');

    // Record onboarding vs dashboard honestly under accepted account state
    console.log(
      `[HONEST_LANDING] SUIA learner destination: ${destinationPath} (${isOnboarding ? 'ONBOARDING' : 'DASHBOARD'})`
    );

    // 3. Verify standard accessToken and refreshToken namespace and absence of admin cookies
    const cookies = await auth.context.cookies();
    assertCookieExists(cookies, 'accessToken', { httpOnly: true, secure: true });
    assertCookieExists(cookies, 'refreshToken', { httpOnly: true, secure: true });
    assertCookieAbsent(cookies, 'admin_accessToken');
    assertCookieAbsent(cookies, 'admin_refreshToken');

    // 4. In-memory inspection of freshly issued tokens for boolean learner purpose metadata
    const accessTokenCookie = cookies.find((c) => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find((c) => c.name === 'refreshToken');
    expect(Boolean(accessTokenCookie?.value), 'accessToken cookie value must exist').toBe(true);
    expect(Boolean(refreshTokenCookie?.value), 'refreshToken cookie value must exist').toBe(true);

    const accessPayload = parseJwtPayloadInMemory(accessTokenCookie!.value);
    const refreshPayload = parseJwtPayloadInMemory(refreshTokenCookie!.value);

    // In-memory verification of access token purpose claims
    const accessAud = accessPayload.aud;
    const accessAudMatches = accessAud === 'user';
    assertValueMatchesSafely(accessAudMatches, true, 'AccessToken aud must be exactly "user"');

    const accessAudAdmin = accessAud === 'admin' || (Array.isArray(accessAud) && accessAud.includes('admin'));
    assertValueMatchesSafely(accessAudAdmin, false, 'AccessToken aud must not be "admin"');

    assertValueMatchesSafely(accessPayload.tokenType, 'user', 'AccessToken tokenType must be "user"');
    assertValueMatchesSafely(accessPayload.isAdmin, false, 'AccessToken isAdmin must be boolean false');
    assertValueMatchesSafely(accessPayload.brand, 'skillup', 'AccessToken brand must be "skillup"');

    // In-memory verification of refresh token purpose claims
    const refreshAud = refreshPayload.aud;
    const refreshAudMatches = refreshAud === 'user';
    assertValueMatchesSafely(refreshAudMatches, true, 'RefreshToken aud must be exactly "user"');

    const refreshAudAdmin = refreshAud === 'admin' || (Array.isArray(refreshAud) && refreshAud.includes('admin'));
    assertValueMatchesSafely(refreshAudAdmin, false, 'RefreshToken aud must not be "admin"');

    assertValueMatchesSafely(refreshPayload.tokenType, 'user', 'RefreshToken tokenType must be "user"');
    assertValueMatchesSafely(refreshPayload.isAdmin, false, 'RefreshToken isAdmin must be boolean false');
    assertValueMatchesSafely(refreshPayload.brand, 'skillup', 'RefreshToken brand must be "skillup"');

    // 5. Guarded successful profile request with in-memory account comparison
    const profileResponse = await auth.apiGet('/api/profile');
    expect(profileResponse.status(), 'Guarded authenticated /api/profile must succeed with 200').toBe(200);
    const profileData = await profileResponse.json();
    const profileEmail = profileData?.email ?? profileData?.data?.email;
    assertValueMatchesSafely(profileEmail, creds.email, 'Profile email matches authenticated user credentials');
  });
});
