import { test as baseTest, expect, Page, BrowserContext } from '@playwright/test';
import { validateOriginSafety, installNetworkOriginGuard, checkReadinessPrerequisites } from '../helpers/readiness';

export interface AuthFixtureContext {
  page: Page;
  context: BrowserContext;
  loginViaUI: (loginPath: string, email: string, pass: string) => Promise<void>;
  performLogout: () => Promise<void>;
}

export const test = baseTest.extend<{ auth: AuthFixtureContext }>({
  // 1. Guard context fixture: enforce readiness BEFORE attempting any browser launch
  context: async ({ playwright, baseURL }, use, testInfo) => {
    const readiness = checkReadinessPrerequisites(testInfo.title);
    if (!readiness.ready) {
      testInfo.skip(true, `[NOT EXECUTED] ${readiness.reason}`);
      return;
    }

    validateOriginSafety(baseURL);
    const browser = await playwright.chromium.launch();
    const ctx = await browser.newContext({ baseURL });
    await installNetworkOriginGuard(ctx);
    await use(ctx);
    await ctx.close();
    await browser.close();
  },

  // 2. Page fixture: only created if context was created
  page: async ({ context }, use, testInfo) => {
    if (testInfo.status === 'skipped' || !context) {
      return;
    }
    const pg = await context.newPage();
    await use(pg);
    await pg.close();
  },

  // 3. Auth fixture: provided to tests
  auth: async ({ page, context, baseURL }, use, testInfo) => {
    if (testInfo.status === 'skipped' || !page || !context) {
      return;
    }

    // Clear cookies before test run to ensure strict session isolation
    await context.clearCookies();

    const loginViaUI = async (loginPath: string, email: string, pass: string) => {
      await page.goto(loginPath, { waitUntil: 'domcontentloaded' });
      validateOriginSafety(page.url());

      const emailInput = page.locator('input[type="email"], input[name="email"], input#email').first();
      const passInput = page.locator('input[type="password"], input[name="password"], input#password').first();
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();

      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await emailInput.fill(email);

      await expect(passInput).toBeVisible({ timeout: 10000 });
      await passInput.fill(pass);

      await submitBtn.click();
    };

    const performLogout = async () => {
      const logoutBtn = page.locator(
        'button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Logout")'
      ).first();

      const isVisible = await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isVisible) {
        throw new Error(
          '[UNSUPPORTED_ACTION] Logout control is not visible or supported on current page. Navigation to /login cannot substitute for true logout revocation.'
        );
      }
      await logoutBtn.click();
    };

    await use({
      page,
      context,
      loginViaUI,
      performLogout,
    });

    try {
      await context.clearCookies();
    } catch {
      // Ignore if closed
    }
  },
});

export { expect };
