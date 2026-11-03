import { test as baseTest, expect, Page, BrowserContext, APIRequestContext, APIResponse } from '@playwright/test';
import { validateOriginSafety, installNetworkOriginGuard, checkReadinessPrerequisites } from '../helpers/readiness';

export interface GuardedApiOptions {
  headers?: Record<string, string>;
  data?: any;
}

/**
 * Executes a guarded API request enforcing:
 * 1. Exact origin match against project's configured allowedBaseURL.
 * 2. Origin safety validation before network dispatch.
 * 3. Automatic redirect following DISABLED (maxRedirects: 0).
 * 4. Explicit Location header validation on 3xx redirect responses.
 */
export async function guardedApiFetch(
  requestContext: APIRequestContext,
  allowedOrigin: string,
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  options?: GuardedApiOptions
): Promise<APIResponse> {
  // 1. Validate allowed project origin
  validateOriginSafety(allowedOrigin);
  const allowedParsed = new URL(allowedOrigin);

  // 2. Resolve target URL against allowed origin
  let targetUrl: URL;
  try {
    targetUrl = new URL(endpoint, allowedOrigin);
  } catch {
    throw new Error(`[GUARDED_API SAFETY VIOLATION] Invalid endpoint URL: ${endpoint}`);
  }

  // 3. Exact origin match guard: target origin must match project allowed origin exactly
  if (targetUrl.origin !== allowedParsed.origin) {
    throw new Error(
      `[GUARDED_API SAFETY VIOLATION] Target origin ${targetUrl.origin} does not match allowed project origin ${allowedParsed.origin}. Dispatch blocked fail-closed.`
    );
  }
  validateOriginSafety(targetUrl.origin);

  // 4. Dispatch with automatic redirects disabled (maxRedirects: 0)
  const response = await requestContext.fetch(targetUrl.toString(), {
    method,
    headers: options?.headers,
    data: options?.data,
    maxRedirects: 0,
  });

  // 5. Inspect 3xx redirect response Location before any explicit follow-up
  const status = response.status();
  if ([301, 302, 303, 307, 308].includes(status)) {
    const location = response.headers()['location'];
    if (location) {
      const redirectUrl = new URL(location, targetUrl.origin);
      if (redirectUrl.origin !== allowedParsed.origin) {
        throw new Error(
          `[GUARDED_API SAFETY VIOLATION] Redirect to non-allowed origin ${redirectUrl.origin} blocked fail-closed.`
        );
      }
      validateOriginSafety(redirectUrl.origin);
    }
  }

  return response;
}

export interface AuthFixtureContext {
  page: Page;
  context: BrowserContext;
  loginViaUI: (loginPath: string, email: string, pass: string) => Promise<void>;
  performLogout: () => Promise<void>;
  apiGet: (path: string, options?: GuardedApiOptions) => Promise<APIResponse>;
  apiPost: (path: string, options?: GuardedApiOptions) => Promise<APIResponse>;
  apiDelete: (path: string, options?: GuardedApiOptions) => Promise<APIResponse>;
}

export const test = baseTest.extend<{ auth: AuthFixtureContext }>({
  // 1. Guard context fixture: enforce readiness BEFORE allocating browser or context
  context: async ({ playwright, baseURL }, use, testInfo) => {
    const projectName = testInfo.project.name;
    const readiness = checkReadinessPrerequisites({
      projectName,
      projectOrigin: baseURL,
    });

    if (!readiness.ready) {
      testInfo.skip(true, readiness.reason || '[NOT EXECUTED] Prerequisites unfulfilled');
      return;
    }

    validateOriginSafety(baseURL);

    // Launch Chromium only after readiness is certified
    const browser = await playwright.chromium.launch();
    const ctx = await browser.newContext({
      baseURL,
      serviceWorkers: 'block', // Strictly block service workers for test isolation
    });

    // Install network routing guard on context
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
    if (testInfo.status === 'skipped' || !page || !context || !baseURL) {
      return;
    }

    // Clear cookies before test run to ensure clean session isolation
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

    const apiGet = (path: string, opts?: GuardedApiOptions) =>
      guardedApiFetch(page.request, baseURL, 'GET', path, opts);

    const apiPost = (path: string, opts?: GuardedApiOptions) =>
      guardedApiFetch(page.request, baseURL, 'POST', path, opts);

    const apiDelete = (path: string, opts?: GuardedApiOptions) =>
      guardedApiFetch(page.request, baseURL, 'DELETE', path, opts);

    await use({
      page,
      context,
      loginViaUI,
      performLogout,
      apiGet,
      apiPost,
      apiDelete,
    });

    try {
      await context.clearCookies();
    } catch {
      // Ignore if closed
    }
  },
});

export { expect };
