import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { assertValueMatchesSafely } from './helpers/sanitized-evidence';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';

interface CookiePolicyRule {
  name: string;
  httpOnly: boolean;
  secure?: boolean;
  sameSite?: 'None' | 'Lax' | 'Strict';
  domainPattern?: RegExp;
  path?: string;
}

function verifyCookiePolicySafely(
  cookies: Array<{ name: string; domain?: string; path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: string }>,
  rules: CookiePolicyRule[]
): void {
  for (const rule of rules) {
    const matching = cookies.filter((c) => c.name === rule.name);
    expect(matching.length > 0, `Policy check: cookie '${rule.name}' must be present in context`).toBe(true);
    for (const cookie of matching) {
      expect(cookie.httpOnly === rule.httpOnly, `Policy check: cookie '${rule.name}' httpOnly match`).toBe(true);
      if (rule.secure !== undefined) {
        expect(cookie.secure === rule.secure, `Policy check: cookie '${rule.name}' secure match`).toBe(true);
      }
      if (rule.sameSite !== undefined) {
        expect(
          typeof cookie.sameSite === 'string' && cookie.sameSite.toLowerCase() === rule.sameSite.toLowerCase(),
          `Policy check: cookie '${rule.name}' sameSite match`
        ).toBe(true);
      }
      if (rule.path !== undefined) {
        expect(cookie.path === rule.path, `Policy check: cookie '${rule.name}' path match`).toBe(true);
      }
      if (rule.domainPattern !== undefined) {
        expect(
          typeof cookie.domain === 'string' && rule.domainPattern.test(cookie.domain),
          `Policy check: cookie '${rule.name}' domain match`
        ).toBe(true);
      }
    }
  }
}

test.describe('SUIA Learner Authentication & Dashboard Qualification', () => {
  test('AQ-01: SUIA learner direct anonymous dashboard denial, GUI login, protected dashboard access, reload, and cookie policy', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'suia-chromium',
      projectOrigin: process.env.SUIA_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SUIA_LEARNER.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SUIA_LEARNER);

    // 1. Direct anonymous check: unauthenticated request to /dashboard must be rejected by source proxy
    const anonCheck = await auth.page.request.get('/dashboard', { maxRedirects: 0 });
    expect(
      [302, 307, 308].includes(anonCheck.status()),
      'Anonymous request to /dashboard must be rejected with redirect status (not 200)'
    ).toBe(true);
    const redirectLocation = anonCheck.headers()['location'] || '';
    expect(
      redirectLocation.includes('/login'),
      'Redirect location must direct to login endpoint'
    ).toBe(true);

    // Also observe browser navigation denial: attempting to navigate directly to /dashboard
    // triggers redirect away from /dashboard (blocked from production transport by network guard)
    let directNavFailed = false;
    try {
      await auth.page.goto('/dashboard', { timeout: 10000 });
    } catch {
      directNavFailed = true;
    }
    // Access to /dashboard must be denied either by redirect away or safety interception of foreign origin
    const deniedProtectedAccess = directNavFailed || !auth.page.url().endsWith('/dashboard');
    expect(deniedProtectedAccess, 'Unauthenticated browser must never obtain protected /dashboard content').toBe(true);

    // 2. Log in through the actual GUI with the approved SUIA learner account on the local origin
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 3. Redirection to learner destination
    await expect(auth.page).toHaveURL(/\/dashboard|\/onboarding|\/learn|\/account/, { timeout: 30000 });

    // 4. Navigate explicitly to /dashboard
    await auth.page.goto('/dashboard');
    await expect(auth.page).toHaveURL(/\/dashboard$/, { timeout: 15000 });

    // Wait for hydration and network to settle
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);

    const currentUrl = auth.page.url();
    if (currentUrl.includes('/onboarding')) {
      testInfo.skip(
        true,
        `[NOT EXECUTED] Approved SUIA learner redirected from /dashboard to /onboarding due to onboardingCompleted === false. Modifying account onboarding state is prohibited.`
      );
      return;
    }

    // 5. Assert source-grounded visible dashboard content
    const dashboardHeading = auth.page.locator('h1').first();
    await expect(dashboardHeading).toBeVisible({ timeout: 15000 });
    const headingText = await dashboardHeading.innerText();
    expect(
      headingText.includes('Welcome back') || headingText.includes('Dashboard'),
      'Dashboard heading must display authenticated learner welcome content'
    ).toBe(true);

    // Check TopBar controls (Logout button)
    const logoutControl = auth.page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    await expect(logoutControl).toBeVisible({ timeout: 10000 });

    // 6. Verify authenticated profile control in memory
    const apiResponse = await auth.apiGet('/api/profile');
    expect(apiResponse.status(), 'Authenticated profile request must succeed').toBe(200);
    const data = await apiResponse.json();
    assertValueMatchesSafely(data?.email, creds.email, 'User email matches credentials');

    // 7. Reload /dashboard and verify it still renders
    await auth.page.reload();
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);
    await expect(auth.page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
    await expect(dashboardHeading).toBeVisible({ timeout: 15000 });
    await expect(logoutControl).toBeVisible({ timeout: 10000 });

    // 8. Task D: Cookie policy verification on active authenticated session
    const cookies = await auth.context.cookies();
    verifyCookiePolicySafely(cookies, [
      {
        name: 'accessToken',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        domainPattern: /\.skillup\.localhost$|^skillup\.localhost$/,
        path: '/',
      },
      {
        name: 'refreshToken',
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        domainPattern: /\.skillup\.localhost$|^skillup\.localhost$/,
        path: '/',
      },
      {
        name: 'csrfToken',
        httpOnly: false,
        path: '/',
      },
    ]);
  });
});
