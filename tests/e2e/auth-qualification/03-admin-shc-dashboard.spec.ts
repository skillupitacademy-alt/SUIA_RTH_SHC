import { test, expect } from './fixtures/auth.fixtures';
import { enforceReadinessBoundary } from './helpers/readiness';
import { SYNTHETIC_ACCOUNTS, getAccountCredentials } from './helpers/test-credentials';
import { verifyCookiePolicySafely } from './helpers/cookie-policy-verifier';

test.describe('SHC Administrator Dashboard Qualification', () => {
  test('AQ-03: SHC admin direct anonymous dashboard denial, GUI login, protected dashboard access, reload, and cookie policy', async ({ auth }, testInfo) => {
    enforceReadinessBoundary(testInfo, {
      projectName: 'shc-chromium',
      projectOrigin: process.env.SHC_BASE_URL,
      requiredAccountVars: [
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.emailEnvVar,
        SYNTHETIC_ACCOUNTS.SHC_ADMIN.passwordEnvVar,
      ],
    });

    const creds = getAccountCredentials(SYNTHETIC_ACCOUNTS.SHC_ADMIN);

    // 1. Direct anonymous navigation to /dashboard: AdminGuard must deny and redirect to /login
    await auth.page.goto('/dashboard');
    await expect(auth.page).toHaveURL(/\/login/, { timeout: 15000 });
    const loginEmailInput = auth.page.locator('input[type="email"], input[name="email"]').first();
    await expect(loginEmailInput).toBeVisible({ timeout: 10000 });

    // 2. Log in through the actual SHC admin GUI login page
    await auth.loginViaUI('/login', creds.email, creds.password);

    // 3. Verify redirection to administrator destination
    await expect(auth.page).toHaveURL(/\/dashboard|\/admin(\/|$)/, { timeout: 20000 });

    // 4. Navigate explicitly to /dashboard
    await auth.page.goto('/dashboard');
    await expect(auth.page).toHaveURL(/\/dashboard$/, { timeout: 15000 });

    // Wait for hydration and network to settle
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);

    // 5. Assert source-grounded visible protected dashboard content
    const headerTitle = auth.page.locator('text=Admin Dashboard').first();
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    const totalUsersStat = auth.page.locator('text=Total Users').first();
    await expect(totalUsersStat).toBeVisible({ timeout: 10000 });

    const activeLearnersStat = auth.page.locator('text=Active Learners').first();
    await expect(activeLearnersStat).toBeVisible({ timeout: 10000 });

    // 6. Reload /dashboard and verify it still renders
    await auth.page.reload();
    await auth.page.waitForLoadState('networkidle').catch(() => {});
    await auth.page.waitForTimeout(2000);
    await expect(auth.page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
    await expect(headerTitle).toBeVisible({ timeout: 15000 });
    await expect(totalUsersStat).toBeVisible({ timeout: 10000 });

    // 7. Task D: Complete cookie policy verification on active authenticated session
    const cookies = await auth.context.cookies();
    verifyCookiePolicySafely(cookies, [
      {
        name: 'admin_accessToken',
        httpOnly: true,
        secure: false, // in development (NODE_ENV !== 'production')
        sameSite: 'Lax',
        exactPath: '/',
        exactDomain: 'skillhubcore.localhost',
      },
      {
        name: 'admin_refreshToken',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        exactPath: '/',
        exactDomain: 'skillhubcore.localhost',
      },
      {
        name: 'accessToken',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        exactPath: '/',
        exactDomain: 'skillhubcore.localhost',
      },
      {
        name: 'refreshToken',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        exactPath: '/',
        exactDomain: 'skillhubcore.localhost',
      },
    ]);
  });
});
