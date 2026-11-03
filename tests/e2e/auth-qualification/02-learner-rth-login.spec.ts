import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';
import { verifyCookiePolicySafely } from './helpers/cookie-policy-verifier';

test.describe('RTH Learner Authentication & Dashboard Qualification', () => {
  test('AQ-02: RTH learner direct anonymous dashboard denial, GUI login, protected dashboard access, reload, and cookie policy', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'rth-chromium',
      projectOrigin: process.env.RTH_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.RTH_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.RTH_LEARNER);
    const baseOrigin = process.env.RTH_BASE_URL ?? 'http://realtutorialhub.localhost:3003';

    // 1. Direct anonymous navigation to /dashboard: must fail-closed and redirect to same-origin /login
    await auth.page.goto('/dashboard');
    const expectedLoginUrl = `${baseOrigin}/login?redirect=%2Fdashboard`;
    await expect(auth.page).toHaveURL(expectedLoginUrl, { timeout: 15000 });

    // Assert visible login form on landed page
    const loginEmailInput = auth.page.locator('input[type="email"], input[name="email"]').first();
    await expect(loginEmailInput).toBeVisible({ timeout: 10000 });

    // Verify unauthenticated API rejection via guarded API helper
    const unauthApiCheck = await auth.apiGet('/api/profile');
    expect(unauthApiCheck.status(), 'Unauthenticated /api/profile request must reject with 401').toBe(401);

    // 2. Log in through the actual GUI with the approved RTH learner account on local origin
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 3. Observe post-login destination
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/tutorials|\/account|\/learn/, { timeout: 30000 });

    // 4. Honest onboarding outcome classification BEFORE exact dashboard assertions
    const currentUrl = auth.page.url();
    if (currentUrl.includes('/onboarding')) {
      testInfo.skip(
        true,
        `[NOT EXECUTED] Approved RTH learner landed on /onboarding due to onboardingCompleted === false. Modifying account onboarding state is prohibited.`
      );
      return;
    }

    // 5. Navigate explicitly to /dashboard
    await auth.page.goto('/dashboard');
    await expect(auth.page).toHaveURL(`${baseOrigin}/dashboard`, { timeout: 15000 });

    // Wait for hydration and network to settle
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);

    // 6. Assert source-grounded visible dashboard content
    const dashboardHeading = auth.page.locator('h1').first();
    await expect(dashboardHeading).toBeVisible({ timeout: 15000 });
    const headingText = await dashboardHeading.innerText();
    expect(
      headingText.includes('Welcome back') || headingText.includes('Dashboard'),
      'Dashboard heading must display authenticated learner welcome content'
    ).toBe(true);

    // Check TopBar Logout control
    const logoutControl = auth.page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    await expect(logoutControl).toBeVisible({ timeout: 10000 });

    // 7. Verify authenticated profile control in memory via guarded API helper
    const apiResponse = await auth.apiGet('/api/profile');
    expect(apiResponse.status(), 'Authenticated profile request must succeed').toBe(200);
    const data = await apiResponse.json();
    assertValueMatchesSafely(data?.email, creds.email, 'User email matches credentials');

    // 8. Reload /dashboard and verify it still renders
    await auth.page.reload();
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);
    await expect(auth.page).toHaveURL(`${baseOrigin}/dashboard`, { timeout: 15000 });
    await expect(dashboardHeading).toBeVisible({ timeout: 15000 });
    await expect(logoutControl).toBeVisible({ timeout: 10000 });

    // 9. Task D: Complete cookie policy verification on active authenticated session
    const cookies = await auth.context.cookies();
    verifyCookiePolicySafely(cookies, [
      {
        name: 'accessToken',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        exactPath: '/',
        exactDomain: 'realtutorialhub.localhost',
      },
      {
        name: 'refreshToken',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        exactPath: '/',
        exactDomain: 'realtutorialhub.localhost',
      },
      {
        name: 'csrfToken',
        httpOnly: false,
        secure: true,
        sameSite: 'None',
        exactPath: '/',
        exactDomain: 'realtutorialhub.localhost',
      },
    ]);
  });
});
