import { test as baseTest, expect, Page, BrowserContext } from '@playwright/test';
import { sanitizeString } from '../helpers/sanitized-evidence';

export interface AuthFixtureContext {
  page: Page;
  context: BrowserContext;
  loginViaUI: (loginUrl: string, email: string, pass: string) => Promise<void>;
  performLogout: (logoutUrl: string) => Promise<void>;
}

export const test = baseTest.extend<{ auth: AuthFixtureContext }>({
  auth: async ({ page, context }, use) => {
    // Clear cookies before each test to guarantee fresh isolation
    await context.clearCookies();

    const loginViaUI = async (loginUrl: string, email: string, pass: string) => {
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

      const emailInput = page.locator('input[type="email"], input[name="email"], input#email').first();
      const passInput = page.locator('input[type="password"], input[name="password"], input#password').first();
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();

      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await emailInput.fill(email);

      await expect(passInput).toBeVisible({ timeout: 10000 });
      await passInput.fill(pass);

      await submitBtn.click();
    };

    const performLogout = async (logoutUrl: string) => {
      const logoutBtn = page.locator('button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      } else {
        await page.goto(logoutUrl, { waitUntil: 'domcontentloaded' });
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
