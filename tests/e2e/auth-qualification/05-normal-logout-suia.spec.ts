import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertCookieExists, assertCookieAbsent, assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

test.describe('SUIA Normal Single-Session UI Logout Qualification', () => {
  test('AQ-05-NORMAL: SUIA normal UI single-session logout and cookie clearance', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'suia-chromium',
      projectOrigin: process.env.SUIA_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // 1. Fresh context: approved SUIA account logs in through the actual /login UI
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 2. Observe post-login landing URL
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/learn|\/account/, { timeout: 30000 });
    const landedUrl = auth.page.url();

    // 3. Confirm active session cookies established
    const cookiesBefore = await auth.context.cookies();
    assertCookieExists(cookiesBefore, 'accessToken', { httpOnly: true });
    assertCookieExists(cookiesBefore, 'refreshToken', { httpOnly: true });

    // 4. Confirm authenticated profile access control
    const profileBefore = await auth.apiGet('/api/profile');
    expect(profileBefore.status(), 'Authenticated profile request must succeed').toBe(200);
    const profileData = await profileBefore.json();
    assertValueMatchesSafely(profileData?.email, creds.email, 'User email matches credentials');

    // 5. Inspect whether the actual visible Logout control exists on the landed page
    const logoutSelector = 'button:has-text("Logout"), button:has-text("Sign out"), button:has-text("Log out"), a:has-text("Logout"), a:has-text("Sign out")';
    const logoutControl = auth.page.locator(logoutSelector).first();
    const isLogoutVisible = await logoutControl.isVisible().catch(() => false);

    if (!isLogoutVisible) {
      // Per governing instructions: if no Logout control exists on the landed page for this account,
      // record NOT EXECUTED with source evidence rather than inventing an action or completing onboarding.
      testInfo.skip(
        true,
        `[NOT EXECUTED] Approved SUIA learner account landed on ${new URL(landedUrl).pathname}, where no visible Logout control exists. Completing onboarding or calling account-wide revocation is prohibited.`
      );
      return;
    }

    // Allow dashboard client hydration to attach onClick event handlers
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2500);

    // 6. If visible, click the real visible Logout control and observe normal logout request (POST /api/auth/logout)
    const logoutResponsePromise = auth.page.waitForResponse(
      resp => resp.url().includes('/api/auth/logout') && resp.request().method() === 'POST',
      { timeout: 15000 }
    );

    await logoutControl.click();

    const logoutResp = await logoutResponsePromise;
    expect(logoutResp.status(), 'Normal single-session logout must succeed with HTTP 200').toBe(200);

    // 7. Verify redirection/landing after logout
    await expect(auth.page).toHaveURL(/\/login(\?|$)/, { timeout: 15000 });

    // 8. Verify browser cookies cleared
    const cookiesAfter = await auth.context.cookies();
    assertCookieAbsent(cookiesAfter, 'accessToken');
    assertCookieAbsent(cookiesAfter, 'refreshToken');

    // 9. Verify subsequent protected access is denied
    const profileAfter = await auth.apiGet('/api/profile');
    expect(
      [401, 403].includes(profileAfter.status()),
      'Subsequent protected access must be denied after logout'
    ).toBe(true);
  });
});
