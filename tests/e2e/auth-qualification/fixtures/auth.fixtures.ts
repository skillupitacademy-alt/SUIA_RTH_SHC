import { test as baseTest, expect, Page, BrowserContext } from '@playwright/test';
import { validateOriginSafety } from '../helpers/readiness';

export interface AuthFixtureContext {
  page: Page;
  context: BrowserContext;
  loginViaUI: (loginPath: string, email: string, pass: string) => Promise<void>;
  performLogout: (logoutPath?: string) => Promise<void>;
}

export const test = baseTest.extend<{ auth: AuthFixtureContext }>({
  auth: async ({ page, context, baseURL }, use) => {
    // 1. Enforce fail-closed origin boundary before any browser activity
    validateOriginSafety(baseURL);

    // 2. Clear cookies before each test to guarantee fresh isolation
    await context.clearCookies();

    const loginViaUI = async (loginPath: string, email: string, pass: string) => {
      // Guard the destination path
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

    const performLogout = async (logoutPath = '/login') => {
      const logoutBtn = page.locator('button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      } else {
        await page.goto(logoutPath, { waitUntil: 'domcontentloaded' });
      }
    };

    await use({
      page,
      context,
      loginViaUI,
      performLogout,
    });

    // Cleanup after test run
    try {
      await context.clearCookies();
    } catch {
      // Ignore cleanup error if context is already closed
    }
  },
});

export { expect };
